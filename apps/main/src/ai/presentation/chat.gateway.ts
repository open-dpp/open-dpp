import { Logger, UseFilters } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Public } from "@open-dpp/auth";
import { SocketIoExceptionFilter } from "@open-dpp/exception";
import { Server, Socket } from "socket.io";
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

  @Public()
  @SubscribeMessage("userMessage")
  async handleMessage(
    @MessageBody() message: { msg: string; passportUUID: string },
    @ConnectedSocket() client: Socket,
  ) {
    const startTime = Date.now();
    this.logger.log("Start to process message:", message);
    const reply = await this.chatService.askAgent(
      message.msg,
      message.passportUUID,
    );
    client.emit("botMessage", reply);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    this.logger.log(`Processing time: ${executionTime}ms`);
  }
}
