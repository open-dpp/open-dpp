import { Logger, UseFilters } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { SocketIoExceptionFilter } from "@open-dpp/exception";
import { Server, Socket } from "socket.io";
import { AllowAnonymous } from "../../auth/allow-anonymous.decorator";
import { ChatService } from "../chat.service";

@WebSocketGateway({ cors: true, path: "/api/ai-socket" })
@UseFilters(new SocketIoExceptionFilter())
export class ChatGateway {
  private readonly logger: Logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  @AllowAnonymous()
  @SubscribeMessage("userMessage")
  async handleMessage(
    @MessageBody() message: { msg: string; passportUUID: string },
    @ConnectedSocket() client: Socket,
  ) {
    const startTime = Date.now();
    this.logger.log("Start to process message:", message);

    try {
      const reply = await this.chatService.askAgent(
        message.msg,
        message.passportUUID,
      );
      client.emit("botMessage", reply);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.logger.log(`Processing time: ${executionTime}ms`);
    }
    catch (error) {
      client.emit("limitError", {
        msg: error.message || "An error occurred",
        code: error.name === "QuotaExceededError" ? "QUOTA_EXCEEDED" : "ERROR",
      });
    }
  }
}
