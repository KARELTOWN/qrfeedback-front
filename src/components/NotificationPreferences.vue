<template>
    <div class="notification-preferences">
        <h2>🔔 Préférences de notification</h2>

        <div v-if="loading" class="loading">
            Chargement...
        </div>

        <div v-else class="preferences-container">
            <div class="section">
                <h3>Canaux activés</h3>

                <div class="channel-item">
                    <input v-model="preferences.channels.email" type="checkbox" id="channel-email" />
                    <label for="channel-email">📧 Email</label>
                </div>

                <div class="channel-item">
                    <input v-model="preferences.channels.telegram" type="checkbox" id="channel-telegram" />
                    <label for="channel-telegram">📱 Telegram</label>

                    <div v-if="telegramProfile" class="telegram-connected">
                        ✅ Connecté: @{{ telegramProfile.username || telegramProfile.firstName }}
                        <button @click="disconnectTelegram" class="btn-secondary-small">
                            Déconnecter
                        </button>
                    </div>
                    <div v-else class="telegram-not-connected">
                        <button @click="connectTelegram" class="btn-primary-small">
                            Se connecter
                        </button>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>Canal préféré</h3>
                <select v-model="preferences.preferredChannel">
                    <option value="email" v-if="preferences.channels.email">📧 Email</option>
                    <option value="telegram" v-if="preferences.channels.telegram">📱 Telegram</option>
                </select>
            </div>

            <div class="actions">
                <button @click="savePreferences" class="btn-primary">
                    Enregistrer
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Preferences {
    channels: {
        email: boolean;
        telegram: boolean;
    };
    preferredChannel: 'email' | 'telegram';
}

interface TelegramProfile {
    chatId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
}

const loading = ref(true);
const preferences = ref<Preferences>({
    channels: {
        email: true,
        telegram: false,
    },
    preferredChannel: 'email',
});
const telegramProfile = ref<TelegramProfile | null>(null);

onMounted(async () => {
    await loadPreferences();
    await loadTelegramProfile();
    loading.value = false;
});

async function loadPreferences() {
    try {
        const response = await fetch('/api/notifications/preferences', {
            credentials: 'include',
        });
        const data = await response.json();
        if (data.preferences) {
            preferences.value = data.preferences;
        }
    } catch (error) {
        console.error('Failed to load preferences:', error);
    }
}

async function loadTelegramProfile() {
    try {
        const response = await fetch('/api/notifications/telegram-profile', {
            credentials: 'include',
        });
        const data = await response.json();
        if (data.telegramProfile?.isActive) {
            telegramProfile.value = data.telegramProfile;
        }
    } catch (error) {
        console.error('Failed to load Telegram profile:', error);
    }
}

async function savePreferences() {
    try {
        const response = await fetch('/api/notifications/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(preferences.value),
        });

        if (response.ok) {
            alert('Préférences enregistrées!');
        } else {
            alert('Erreur lors de l\'enregistrement');
        }
    } catch (error) {
        console.error('Failed to save preferences:', error);
        alert('Erreur lors de l\'enregistrement');
    }
}

function connectTelegram() {
    // Ouvrir une popup ou rediriger vers le bot Telegram
    const botUsername = 'QrFeedbackBot'; // Remplacer par le vrai username du bot
    const deepLink = `https://t.me/${botUsername}?start=${window.btoa(window.location.href)}`;
    window.open(deepLink, '_blank');
}

async function disconnectTelegram() {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Telegram?')) {
        return;
    }

    try {
        const response = await fetch('/api/notifications/telegram-disconnect', {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            telegramProfile.value = null;
            preferences.value.channels.telegram = false;
            alert('Telegram déconnecté');
            await savePreferences();
        }
    } catch (error) {
        console.error('Failed to disconnect Telegram:', error);
        alert('Erreur lors de la déconnexion');
    }
}
</script>

<style scoped>
.notification-preferences {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
}

.loading {
    text-align: center;
    padding: 20px;
    color: #666;
}

.preferences-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.section {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
}

.section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
}

.channel-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    padding: 8px;
    border-radius: 4px;
    background: #f9f9f9;
}

.channel-item input[type="checkbox"] {
    margin-top: 4px;
    cursor: pointer;
}

.channel-item label {
    flex: 1;
    cursor: pointer;
    font-weight: 500;
}

.telegram-connected {
    font-size: 12px;
    color: #0f766e;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e0e0e0;
}

.telegram-not-connected {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e0e0e0;
}

.btn-primary-small {
    padding: 6px 12px;
    background: #0f766e;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.btn-secondary-small {
    padding: 6px 12px;
    background: transparent;
    color: #0f766e;
    border: 1px solid #0f766e;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 14px;
}

.actions {
    display: flex;
    gap: 12px;
}

.btn-primary {
    flex: 1;
    padding: 12px 16px;
    background: #0f766e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
}

.btn-primary:hover {
    background: #0d5d56;
}
</style>
