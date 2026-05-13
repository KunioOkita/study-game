import { useRef } from 'react';
import type { IRefPhaserGame } from './game/PhaserGame';
import { PhaserGame } from './game/PhaserGame';
import { GameUI } from './components/GameUI';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div id="app-container" style={{ display: 'flex', flexDirection: 'column', width: '800px', margin: '0 auto', marginTop: '20px', gap: '10px' }}>
            <PhaserGame ref={phaserRef} />
            <GameUI />
        </div>
    )
}

export default App;
