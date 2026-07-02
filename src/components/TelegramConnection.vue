<template>
    <div class="telegram-connection">
        <div class="card">
            <div class="header">
                <h2>📱 Connecter Telegram</h2>
            </div>

            <div class="content">
                <p>Connectez votre compte à notre bot Telegram <strong>Opinbase</strong> pour:</p>

                <ul class="features">
                    <li>✅ Créer et gérer vos QR codes</li>
                    <li>✅ Recevoir vos avis en temps réel</li>
                    <li>✅ Rechercher et filtrer vos avis</li>
                    <li>✅ Gérer tous vos paramètres</li>
                </ul>

                <div class="connection-steps">
                    <h3>Étapes:</h3>
                    <ol>
                        <li>Cliquez sur le bouton ci-dessous</li>
                        <li>Démarrez une conversation avec notre bot</li>
                        <li>Suivez les instructions du bot</li>
                        <li>Votre compte sera automatiquement lié</li>
                    </ol>
                </div>

                <div v-if="connectionStatus" :class="['status', connectionStatus.type]">
                    {{ connectionStatus.message }}
                </div>

                <div class="actions">
                    <button @click="connectToBot" class="btn-telegram">
                        🚀 Connecter avec Telegram
                    </button>

                    <button @click="showManualConnection = !showManualConnection" class="btn-secondary">
                        {{ showManualConnection ? 'Cacher' : 'Afficher' }} les instructions manuelles
                    </button>
                </div>

                <div v-if="showManualConnection" class="manual-connection">
                    <h3>Connexion manuelle:</h3>

                    <p>Si vous avez des problèmes, vous pouvez vous connecter manuellement:</p>

                    <ol>
                        <li>
                            Ouvrez Telegram et recherchez: <code>Opinbasebot</code>
                        </li>
                        <li>
                            Cliquez sur le bot dans les résultats
                        </li>
                        <li>
                            Tapez <code>/start</code>
                        </li>
                        <li>
                            Suivez les instructions du bot
                        </li>
                    </ol>

                    <div class="code-block">
                        <label>Votre ID de chat (optionnel):</label>
                        <input v-model="userChatId" type="text" readonly />
                        <button @click="copyChatId" class="btn-small">Copier</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ConnectionStatus {
    type: 'success' | 'error' | 'info';
    message: string;
}

const showManualConnection = ref(false);
const userChatId = ref('');
const connectionStatus = ref<ConnectionStatus | null>(null);

const BOT_USERNAME = 'Opinbasebot'; // À remplacer par votre vrai bot username

function connectToBot() {
    const deepLink = `https://t.me/${BOT_USERNAME}?start=connect`;
    window.open(deepLink, '_blank', 'width=500,height=600');

    connectionStatus.value = {
        type: 'info',
        message: '📌 La fenêtre Telegram s\'est ouverte. Veuillez démarrer une conversation avec le bot.',
    };
}

function copyChatId() {
    if (userChatId.value) {
        navigator.clipboard.writeText(userChatId.value);
        alert('ID copié dans le presse-papiers');
    }
}
</script>

<style scoped>
.telegram-connection {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
}

.card {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
    background: linear-gradient(135deg, #0088cc 0%, #00c7ff 100%);
    color: white;
    padding: 24px;
    text-align: center;
}

.header h2 {
    margin: 0;
    font-size: 24px;
}

.content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.features {
    list-style: none;
    padding: 0;
    margin: 16px 0;
}

.features li {
    padding: 8px 0;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.connection-steps {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
}

.connection-steps h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
}

.connection-steps ol {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
}

.connection-steps li {
    margin-bottom: 8px;
}

.status {
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
}

.status.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.status.info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
}

.btn-telegram {
    padding: 12px 24px;
    background: linear-gradient(135deg, #0088cc 0%, #00c7ff 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    transition: transform 0.2s;
}

.btn-telegram:hover {
    transform: scale(1.02);
}

.btn-secondary {
    padding: 10px 16px;
    background: transparent;
    color: #0088cc;
    border: 1px solid #0088cc;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
}

.btn-secondary:hover {
    background: #f0f8ff;
}

.manual-connection {
    background: #fffbf0;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #ff9800;
    margin-top: 16px;
}

.manual-connection h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
}

.manual-connection ol {
    margin: 0 0 16px 0;
    padding-left: 20px;
    font-size: 13px;
}

.manual-connection li {
    margin-bottom: 8px;
}

code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 12px;
    color: #d63384;
}

.code-block {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 12px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}

.code-block label {
    font-size: 12px;
    font-weight: 600;
    min-width: 140px;
}

.code-block input {
    flex: 1;
    padding: 6px 10px;
    border: none;
    font-size: 12px;
    font-family: monospace;
    background: #f9f9f9;
}

.btn-small {
    padding: 6px 12px;
    background: #0088cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.btn-small:hover {
    background: #0066aa;
}
</style>
