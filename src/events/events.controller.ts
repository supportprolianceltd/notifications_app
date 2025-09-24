// src/events/events.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { IncomingEventDto } from './dto/incoming-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async createEvent(@Body() eventData: any) {
    try {
      const jobIds = await this.eventsService.handleEvent(eventData);
      return { 
        success: true, 
        message: 'Event received and processing started',
        jobIds: jobIds
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process event',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('batch')
  async createEventsBatch(@Body() eventsData: any[]) {
    try {
       const results: { success: boolean; event?: any; error?: string }[] = [];
      for (const eventData of eventsData) {
        try {
          await this.eventsService.handleEvent(eventData);
          results.push({ success: true, event: eventData.metadata.event_id });
        } catch (error) {
          results.push({ 
            success: false, 
            event: eventData.metadata?.event_id,
            error: error.message 
          });
        }
      }
      return { results };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process events batch',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}