package com.quiz.service;

import dev.langchain4j.memory.ChatMemory;

import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 测试ChatbotService的会话内存管理功能
 * 专注于TTL过期和内存清理逻辑
 */
class ChatbotMemoryManagementTest {

    @Test
    void testTimedChatMemoryExpiration() {
        // 创建一个TimedChatMemory实例，TTL为1秒
        long ttlMillis = 1000;
        ChatMemory chatMemory = mockChatMemory();
        ChatbotService.TimedChatMemory timedMemory = new ChatbotService.TimedChatMemory(chatMemory, ttlMillis);

        // 验证初始状态
        assertFalse(timedMemory.isExpired());
        assertNotNull(timedMemory.getChatMemory());
        assertEquals(chatMemory, timedMemory.getChatMemory());

        // 验证过期时间设置正确
        long expirationTime = timedMemory.getExpirationTime();
        long expectedExpiration = System.currentTimeMillis() + ttlMillis;
        // 允许100ms的误差
        assertTrue(expirationTime >= expectedExpiration - 100 && expirationTime <= expectedExpiration + 100);

        // 验证续约功能
        long newTtlMillis = 2000;
        timedMemory.renew(newTtlMillis);
        long newExpirationTime = timedMemory.getExpirationTime();
        long expectedNewExpiration = System.currentTimeMillis() + newTtlMillis;
        assertTrue(newExpirationTime >= expectedNewExpiration - 100 && newExpirationTime <= expectedNewExpiration + 100);
        // 续约后应该还没过期
        assertFalse(timedMemory.isExpired());
    }

    @Test
    void testTimedChatMemoryIsExpired() throws InterruptedException {
        // 创建一个TimedChatMemory实例，TTL为500毫秒
        long ttlMillis = 500;
        ChatbotService.TimedChatMemory timedMemory = new ChatbotService.TimedChatMemory(mockChatMemory(), ttlMillis);

        // 刚创建时应该没过期
        assertFalse(timedMemory.isExpired());

        // 等待600毫秒
        Thread.sleep(600);

        // 现在应该过期了
        assertTrue(timedMemory.isExpired());
    }

    @Test
    void testSessionCleanupLogic() throws InterruptedException {
        // 创建一个内存存储
        ConcurrentHashMap<String, ChatbotService.TimedChatMemory> memoryStore = new ConcurrentHashMap<>();

        // 添加三个会话：一个过期的，一个即将过期的，一个新的
        long expiredTtl = 100; // 100ms TTL
        long soonTtl = 1000; // 1s TTL
        long newTtl = 5000; // 5s TTL

        // 添加过期会话
        ChatbotService.TimedChatMemory expiredSession = new ChatbotService.TimedChatMemory(mockChatMemory(), expiredTtl);
        memoryStore.put("expired-session", expiredSession);

        // 等待200ms让第一个会话过期
        Thread.sleep(200);

        // 添加即将过期的会话
        ChatbotService.TimedChatMemory soonSession = new ChatbotService.TimedChatMemory(mockChatMemory(), soonTtl);
        memoryStore.put("soon-expired-session", soonSession);

        // 添加新会话
        ChatbotService.TimedChatMemory newSession = new ChatbotService.TimedChatMemory(mockChatMemory(), newTtl);
        memoryStore.put("new-session", newSession);

        // 执行清理逻辑
        long currentTime = System.currentTimeMillis();
        int cleanedCount = 0;

        // 遍历所有会话，清理过期的
        java.util.Iterator<java.util.Map.Entry<String, ChatbotService.TimedChatMemory>> iterator = memoryStore.entrySet().iterator();
        while (iterator.hasNext()) {
            java.util.Map.Entry<String, ChatbotService.TimedChatMemory> entry = iterator.next();
            if (entry.getValue().isExpired()) {
                iterator.remove();
                cleanedCount++;
            }
        }

        // 验证只有过期的会话被清理了
        assertEquals(1, cleanedCount);
        assertFalse(memoryStore.containsKey("expired-session"));
        assertTrue(memoryStore.containsKey("soon-expired-session"));
        assertTrue(memoryStore.containsKey("new-session"));
    }

    @Test
    void testSessionRenewalOnAccess() throws InterruptedException {
        // 创建内存存储
        ConcurrentHashMap<String, ChatbotService.TimedChatMemory> memoryStore = new ConcurrentHashMap<>();
        String sessionId = "test-session";
        long initialTtl = 500; // 500ms TTL

        // 创建并添加会话
        ChatbotService.TimedChatMemory originalSession = new ChatbotService.TimedChatMemory(mockChatMemory(), initialTtl);
        memoryStore.put(sessionId, originalSession);

        // 等待300ms
        Thread.sleep(300);

        // 获取会话并续约
        ChatbotService.TimedChatMemory session = memoryStore.get(sessionId);
        assertNotNull(session);
        long expirationBeforeRenew = session.getExpirationTime();

        // 续约会话
        long newTtl = 1000;
        session.renew(newTtl);
        long expirationAfterRenew = session.getExpirationTime();

        // 验证续约后过期时间增加了
        assertTrue(expirationAfterRenew > expirationBeforeRenew);

        // 等待400ms (总时间700ms，超过初始TTL但在续约后的TTL内)
        Thread.sleep(400);

        // 会话应该还没过期
        assertFalse(session.isExpired());
    }

    // 创建一个简单的ChatMemory模拟对象
    private ChatMemory mockChatMemory() {
        // 使用实际的MessageWindowChatMemory实现
        return dev.langchain4j.memory.chat.MessageWindowChatMemory.withMaxMessages(10);
    }
}