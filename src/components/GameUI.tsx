import React, { useState, useEffect } from 'react';
import { EventBus } from '../game/EventBus';

const STAGE_CONFIGS = [
    { targetEnemies: 10, type: 'addition', name: 'Stage 1 (足し算)' },
    { targetEnemies: 15, type: 'subtraction', name: 'Stage 2 (引き算)' },
    { targetEnemies: 20, type: 'multiplication', name: 'Stage 3 (掛け算)' },
    { targetEnemies: 25, type: 'kanji', name: 'Stage 4 (漢字の読み)' }
];

export const GameUI: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'cleared' | 'gameover' | 'all_cleared'>('start');
    const [stage, setStage] = useState(1);
    const [points, setPoints] = useState(0);
    const [hp, setHp] = useState(100);
    const [level, setLevel] = useState(1);
    const [question, setQuestion] = useState<{ q: string, a: string | number }>({ q: '', a: 0 });
    const [options, setOptions] = useState<(string | number)[]>([]);

    const generateQuestion = (currentStage = stage) => {
        const config = STAGE_CONFIGS[currentStage - 1];
        if (!config) return;

        let q = '';
        let a: string | number = 0;
        let opts: (string | number)[] = [];

        if (config.type === 'addition') {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            a = num1 + num2;
            q = `${num1} + ${num2} = ?`;
            opts = [a];
            while (opts.length < 3) {
                const wrong: number = (a as number) + Math.floor(Math.random() * 10) - 5;
                if (wrong !== a && !opts.includes(wrong) && wrong > 0) opts.push(wrong);
            }
        } else if (config.type === 'subtraction') {
            const num1 = Math.floor(Math.random() * 10) + 10;
            const num2 = Math.floor(Math.random() * 10) + 1;
            a = num1 - num2;
            q = `${num1} - ${num2} = ?`;
            opts = [a];
            while (opts.length < 3) {
                const wrong: number = (a as number) + Math.floor(Math.random() * 10) - 5;
                if (wrong !== a && !opts.includes(wrong) && wrong > 0) opts.push(wrong);
            }
        } else if (config.type === 'multiplication') {
            const num1 = Math.floor(Math.random() * 9) + 1;
            const num2 = Math.floor(Math.random() * 9) + 1;
            a = num1 * num2;
            q = `${num1} × ${num2} = ?`;
            opts = [a];
            while (opts.length < 3) {
                const wrong: number = (a as number) + Math.floor(Math.random() * 20) - 10;
                if (wrong !== a && !opts.includes(wrong) && wrong > 0) opts.push(wrong);
            }
        } else if (config.type === 'kanji') {
            const kanjiList = [
                { k: '学校', r: 'がっこう', w: ['がくこう', 'かっこう', 'かくこう'] },
                { k: '先生', r: 'せんせい', w: ['せんせえ', 'ぜんせい', 'せんぜい'] },
                { k: '勉強', r: 'べんきょう', w: ['べんきょ', 'へんきょう', 'べんぎょう'] },
                { k: '友達', r: 'ともだち', w: ['ともたち', 'どまだち', 'ともだじ'] },
                { k: '時計', r: 'とけい', w: ['とげい', 'どけい', 'とけえ'] }
            ];
            const choice = kanjiList[Math.floor(Math.random() * kanjiList.length)];
            q = `「${choice.k}」の読み方は？`;
            a = choice.r;
            opts = [a, ...choice.w].slice(0, 3);
        }

        setQuestion({ q, a });
        setOptions(opts.sort(() => Math.random() - 0.5));
    };

    const startStage = (stageNum: number) => {
        setStage(stageNum);
        setGameState('playing');
        setHp(100);
        generateQuestion(stageNum);
        EventBus.emit('start-stage', STAGE_CONFIGS[stageNum - 1].targetEnemies);
    };

    useEffect(() => {
        // Phaser側の準備ができたら最初のステージを開始
        EventBus.on('current-scene-ready', () => {
            // 自動スタートさせず、スタート画面を表示する
            setGameState('start');
        });

        EventBus.on('stage-clear', () => {
            if (stage >= STAGE_CONFIGS.length) {
                setGameState('all_cleared');
            } else {
                setGameState('cleared');
            }
        });

        EventBus.on('base-damaged', (damage: number) => {
            setHp((prev) => {
                const nextHp = Math.max(0, prev - damage);
                if (nextHp <= 0) setGameState('gameover');
                return nextHp;
            });
        });

        return () => {
            EventBus.removeListener('current-scene-ready');
            EventBus.removeListener('stage-clear');
            EventBus.removeListener('base-damaged');
        };
    }, [stage]);

    const handleAnswer = (ans: string | number) => {
        if (ans === question.a) {
            setPoints((p) => p + 20);
            generateQuestion();
        }
    };

    const buyTower = () => {
        if (points >= 50) {
            setPoints((p) => p - 50);
            EventBus.emit('buy-tower');
        }
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLevel = parseInt(e.target.value, 10);
        setLevel(newLevel);
        EventBus.emit('change-difficulty', newLevel);
    };

    return (
        <div style={{
            width: '800px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '10px',
            boxSizing: 'border-box',
            backgroundColor: '#444',
            borderRadius: '10px',
            position: 'relative'
        }}>
            {/* 上部ステータス */}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>基地HP: {hp}</h2>
                <h2 style={{ margin: 0 }}>{STAGE_CONFIGS[stage - 1]?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="difficulty" style={{ fontWeight: 'bold' }}>難易度: Lv.{level}</label>
                    <input 
                        type="range" 
                        id="difficulty" 
                        min="1" 
                        max="10" 
                        value={level} 
                        onChange={handleLevelChange}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                <h2 style={{ margin: 0 }}>ポイント: {points}</h2>
            </div>

            {/* 下部UIエリア */}
            <div style={{ display: 'flex', justifyContent: 'space-between', pointerEvents: 'auto' }}>
                {/* クイズパネル */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    flexGrow: 1,
                    marginRight: '10px'
                }}>
                    <h3>{question.q}</h3>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' }}>
                        {options.map((opt, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleAnswer(opt)}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* アイテム購入パネル */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    textAlign: 'center'
                }}>
                    <h3>アイテムショップ</h3>
                    <button 
                        onClick={buyTower}
                        disabled={points < 50}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            cursor: points >= 50 ? 'pointer' : 'not-allowed',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: points >= 50 ? '#2196F3' : '#cccccc',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        防衛タワーを配置 (50pt)
                    </button>
                    <p style={{ fontSize: '12px', marginTop: '5px' }}>※購入後、画面をクリック</p>
                </div>
            </div>

            {/* Overlay Screens */}
            {gameState === 'start' && (
                <div style={overlayStyle}>
                    <h1 style={{ fontSize: '48px', color: 'white' }}>学習タワーディフェンス</h1>
                    <button onClick={() => startStage(1)} style={buttonStyle}>ゲームスタート</button>
                </div>
            )}

            {gameState === 'cleared' && (
                <div style={overlayStyle}>
                    <h1 style={{ fontSize: '48px', color: '#4CAF50' }}>STAGE {stage} CLEAR!</h1>
                    <button onClick={() => startStage(stage + 1)} style={buttonStyle}>次のステージへ</button>
                </div>
            )}

            {gameState === 'all_cleared' && (
                <div style={overlayStyle}>
                    <h1 style={{ fontSize: '48px', color: '#FFD700' }}>GAME CLEAR!!</h1>
                    <p style={{ color: 'white', fontSize: '20px' }}>すべてのステージをクリアしました！</p>
                    <button onClick={() => startStage(1)} style={buttonStyle}>最初から遊ぶ</button>
                </div>
            )}

            {gameState === 'gameover' && (
                <div style={overlayStyle}>
                    <h1 style={{ fontSize: '48px', color: 'red' }}>GAME OVER</h1>
                    <button onClick={() => startStage(stage)} style={buttonStyle}>このステージをやり直す</button>
                </div>
            )}
        </div>
    );
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: '40px',
    zIndex: 1000
};

const buttonStyle: React.CSSProperties = {
    marginTop: '20px',
    padding: '15px 30px',
    fontSize: '24px',
    cursor: 'pointer',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#FF9800',
    color: 'white',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
};
