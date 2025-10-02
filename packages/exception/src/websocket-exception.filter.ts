// ws-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  Logger,
  WsExceptionFilter,
} from '@nestjs/common';

@Catch(Error)
export class SocketIoExceptionFilter implements WsExceptionFilter {
  private readonly logger: Logger = new Logger(SocketIoExceptionFilter.name);
  catch(error: Error, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    this.logger.error(error.message);
    // Normalize error format
    client.emit('errorMessage', error.message);
  }
}
