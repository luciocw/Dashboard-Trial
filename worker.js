importScripts('https://unpkg.com/dexie@latest/dist/dexie.js');

const db = new Dexie('FantasyAuditorDB');
db.version(1).stores({ 
    players: 'player_id, position', 
    stats: '++id, [player_id+season]' 
});

self.onmessage = async (e) => {
    if (e.data.type === 'SYNC_PLAYERS') {
        try {
            // Busca a lista global de jogadores do Sleeper (50MB+)
            const resp = await fetch('https://api.sleeper.app/v1/players/nfl');
            const data = await resp.json();
            
            // Transforma o objeto em um formato que o banco de dados entende
            const playerArray = Object.entries(data).map(([id, info]) => ({
                player_id: id,
                full_name: info.full_name || (info.first_name + ' ' + info.last_name),
                position: info.position,
                team: info.team
            }));

            // Limpa o banco antigo e salva o novo para evitar duplicados
            await db.players.clear();
            await db.players.bulkPut(playerArray);

            // Avisa o index.html que terminou
            self.postMessage({ type: 'SYNC_COMPLETE' });
        } catch (err) {
            console.error("Erro no Worker:", err);
        }
    }
};
