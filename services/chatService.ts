import { ChatSession } from '../types';
import { getAttachments } from './indexedDBService';

const CHATS_KEY = 'kchat-sessions';

export const loadChats = async (): Promise<ChatSession[]> => {
    try {
        const saved = localStorage.getItem(CHATS_KEY);
        if (!saved) {
            return [];
        }

        const chats: ChatSession[] = JSON.parse(saved);

        // 收集所有需要从 IndexedDB 加载的附件 ID
        const allAttachmentIds: string[] = [];
        const attachmentLocations: Map<string, { chatId: string; messageId: string; attachmentIndex: number }> = new Map();

        chats.forEach(chat => {
            chat.messages?.forEach(message => {
                message.attachments?.forEach((att, index) => {
                    if (att.id && !att.data) {
                        allAttachmentIds.push(att.id);
                        attachmentLocations.set(att.id, {
                            chatId: chat.id,
                            messageId: message.id,
                            attachmentIndex: index
                        });
                    }
                });
            });
        });

        // 如果有附件需要加载，从 IndexedDB 批量加载
        if (allAttachmentIds.length > 0) {
            try {
                const attachmentDataMap = await getAttachments(allAttachmentIds);

                // 将加载的数据填充回对应的附件对象
                chats.forEach(chat => {
                    chat.messages?.forEach(message => {
                        message.attachments?.forEach(att => {
                            if (att.id && attachmentDataMap.has(att.id)) {
                                att.data = attachmentDataMap.get(att.id);
                            }
                        });
                    });
                });
            } catch (error) {
                console.error('Failed to load attachments from IndexedDB:', error);
            }
        }

        return chats;
    } catch (error) {
        console.error("Failed to load chats from localStorage:", error);
        return [];
    }
};

export const saveChats = (chats: ChatSession[]) => {
    try {
        // 保存时只保留附件的 ID 和元数据，不保存 data（data 存储在 IndexedDB 中）
        // Save only attachment ID and metadata, not data (data is stored in IndexedDB)
        const chatsToSave = chats.map(c => ({
            ...c,
            messages: c.messages.map(m => ({
                ...m,
                attachments: m.attachments?.map(att => ({
                    id: att.id,
                    name: att.name,
                    mimeType: att.mimeType
                    // 不保存 data 字段，它存储在 IndexedDB 中
                }))
            }))
        }));
        
        localStorage.setItem(CHATS_KEY, JSON.stringify(chatsToSave));
    } catch (error) {
        console.error("Failed to save chats to localStorage", error);
        
        // 如果保存失败，尝试进一步精简数据
        try {
            console.warn("Storage quota exceeded, attempting minimal save...");
            const chatsToSaveMinimal = chats.map(c => ({
                ...c,
                messages: c.messages.map(({ attachments, ...m }) => ({
                    ...m,
                    attachments: attachments?.map(({ id, name, mimeType }) => ({ id, name, mimeType }))
                }))
            }));
            localStorage.setItem(CHATS_KEY, JSON.stringify(chatsToSaveMinimal));
            console.warn("Successfully saved chats with minimal data");
        } catch (fallbackError) {
            console.error("Fallback save also failed:", fallbackError);
        }
    }
};