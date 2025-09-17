import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { CustomException } from './error/custom.exception';

export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof CustomException) {
      response.status(200).json({
        code: exception.code,
        errorMsg: exception.errorMsg,
      });
    } else {
      try {
        if (exception?.response?.data) {
          console.log({ msg: exception.response.data });
        } else {
          console.log({ msg: exception });
        }
      } catch (e) {
        console.log(exception);
      }

      response.status(500);
      response.end();
    }
  }
}
