import mongoose, { Schema, Document } from 'mongoose';

export interface IToolCall {
  name: string;
  args?: Record<string, any>;
  output?: any;
  toolCallId?: string;
}

export interface IChatMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolCalls?: IToolCall[];
  createdAt: Date;
}

export interface IChatThread extends Document {
  chatId: string;
  title?: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ToolCallSchema = new Schema<IToolCall>(
  {
    name: { type: String, required: true },
    args: { type: Schema.Types.Mixed },
    output: { type: Schema.Types.Mixed },
    toolCallId: { type: String },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'tool', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    toolCalls: {
      type: [ToolCallSchema],
      default: undefined,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ChatThreadSchema = new Schema<IChatThread>(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const ChatThread = mongoose.models.ChatThread || mongoose.model<IChatThread>('ChatThread', ChatThreadSchema);
export default ChatThread;

