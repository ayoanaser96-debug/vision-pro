import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationPriority } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: {
    userId: string;
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    relatedTestId?: string;
    relatedPrescriptionId?: string;
    relatedAppointmentId?: string;
    metadata?: any;
  }) {
    const notif = new this.notificationModel(notification);
    return notif.save();
  }

  async findByUser(userId: string) {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({ userId, isRead: false });
  }

  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async delete(notificationId: string) {
    return this.notificationModel.findByIdAndDelete(notificationId);
  }
}


