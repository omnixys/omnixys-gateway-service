/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

import { AdminService } from '../admin/admin.service.js';
import {
  KafkaEvent,
  KafkaHandler,
} from '../kafka/decorators/kafka-event.decorator.js';
import {
  type KafkaEventContext,
  KafkaEventHandler,
} from '../kafka/interface/kafka-event.interface.js';
import { KafkaTopics } from '../kafka/kafka-topic.properties.js';
import { LoggerPlusService } from '../logger/logger-plus.service.js';
import { Injectable } from '@nestjs/common';

/**
 * Kafka event handler responsible for administrative commands such as
 * shutdown and restart. It listens for specific admin-related topics
 * and delegates the actual process control logic to the {@link AdminService}.
 *
 * @category Messaging
 * @since 1.0.0
 */
@KafkaHandler('admin')
@Injectable()
export class AdminHandler implements KafkaEventHandler {
  private readonly logger;

  /**
   * Creates a new instance of {@link AdminHandler}.
   *
   * @param loggerService - The central logger service used for structured logging.
   * @param adminService - The service responsible for handling system-level admin operations.
   */
  constructor(
    private readonly loggerService: LoggerPlusService,
    private readonly adminService: AdminService,
  ) {
    this.logger = this.loggerService.getLogger(AdminHandler.name);
  }

  /**
   * Handles incoming Kafka admin events and executes the appropriate administrative command.
   *
   * @param topic - The Kafka topic representing the admin command (e.g. shutdown, restart).
   * @param data - The payload associated with the Kafka message.
   * @param context - The Kafka context metadata containing headers and partition info.
   *
   * @returns A Promise that resolves once the command has been processed.
   */
  @KafkaEvent(
    KafkaTopics.admin.shutdown,
    KafkaTopics.admin.restart,
    KafkaTopics.admin.allShutdown,
    KafkaTopics.admin.allRestart,
  )
  async handle(
    topic: string,
    _data: unknown,
    context: KafkaEventContext,
  ): Promise<void> {
    this.logger.warn(`Admin command received: ${topic}`);
    this.logger.debug('Kafka context: %o', context);

    switch (topic) {
      case KafkaTopics.admin.shutdown:
        await this.handleShutdown(false);
        break;

      case KafkaTopics.admin.allShutdown:
        await this.handleShutdown(true);
        break;

      case KafkaTopics.admin.restart:
        await this.handleRestart(false);
        break;

      case KafkaTopics.admin.allRestart:
        await this.handleRestart(true);
        break;

      default:
        this.logger.warn(`Unknown admin topic: ${topic}`);
    }
  }

  /**
   * Executes a system shutdown command.
   *
   * @param global - If true, indicates that the shutdown request applies to all services in the cluster.
   * @returns A Promise that resolves when the shutdown process has been initiated.
   */
  private async handleShutdown(global: boolean): Promise<void> {
    this.logger.warn(
      global ? 'Global shutdown triggered' : 'Local shutdown triggered',
    );
    await this.adminService.shutdown();
  }

  /**
   * Executes a system restart command.
   *
   * @param global - If true, indicates that the restart request applies to all services in the cluster.
   * @returns A Promise that resolves when the restart process has been initiated.
   */
  private async handleRestart(global: boolean): Promise<void> {
    this.logger.warn(
      global ? 'Global restart triggered' : 'Local restart triggered',
    );
    await this.adminService.restart();
  }
}
