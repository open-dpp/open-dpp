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
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
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
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
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
      );
      const upi = await this.uniqueProductIdentifierRepository.findOneByReferencedId(passport.id);
      if (!upi) {
        this.logger.error(
          `No UniqueProductIdentifier found for passport ${passport.id} (permalink=${message.permalink})`,
        );
        throw new Error("No product identifier found for the provided permalink");
      }

      const reply = await this.chatService.askAgent(
        message.msg,
        upi.uuid,
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
