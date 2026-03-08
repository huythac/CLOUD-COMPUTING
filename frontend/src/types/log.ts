export type CommunicationLog = {
  id: string;
  createdAt: string;
  channel: 'email' | 'sms';
  recipientIds: string[];
  message: string;
  results: {
    recipientId: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
};
