import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { PushModule } from './push/push.module';

@Module({
  providers: [ChannelsService],
  imports: [EmailModule, SmsModule, PushModule]
})
export class ChannelsModule {}
