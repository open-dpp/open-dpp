import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { SocketIoExceptionFilter } from "@open-dpp/exception";
import { Server, Socket } from "socket.io";
import { WebsocketAuthGuard } from "../../identity/auth/infrastructure/guards/websocket-auth.guard";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { PermalinkApplicationService } from "../../permalink/application/services/permalink.application.service";
import { ChatService } from "../chat.service";

@UseGuards(WebsocketAuthGuard)
@WebSocketGateway({ cors: true, path: "/api/ai-socket" })
@UseFilters(new SocketIoExceptionFilter())
export class ChatGateway {
  private readonly logger: Logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly permalinkApplicationService: PermalinkApplicationService,
  ) {}

  @OptionalAuth()
  @SubscribeMessage("userMessage")
  async handleMessage(
    @MessageBody() message: { msg: string; permalink: string },
    @ConnectedSocket() client: Socket,
  ) {
    const startTime = Date.now();
    this.logger.log("Start to process message:", message);

    try {
      const { passport } = await this.permalinkApplicationService.resolveToPassport(
        message.permalink,
        {
          organizationId: client.data.member?.organizationId,
          memberRole: client.data.member?.role,
        },
      );

      // ADR 0006: pass the resolved passportId straight to the agent — no canonical UPI hop.
      const reply = await this.chatService.askAgent(
        message.msg,
        passport.id,
        client.data.user,
        client.data.member,
      );
      client.emit("botMessage", reply);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.logger.log(`Processing time: ${executionTime}ms`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== "QuotaExceededError") {
          this.logger.error("Unexpected error in chat handler", error);
        }
        client.emit("limitError", {
          msg: error.message,
          code: error.name === "QuotaExceededError" ? "QUOTA_EXCEEDED" : "ERROR",
        });
      } else {
        this.logger.error("Unknown error in chat handler", error);
        client.emit("limitError", {
          msg: "An error occurred",
          code: "ERROR",
        });
      }
    }
  }
}
