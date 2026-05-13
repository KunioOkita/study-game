import React, { useState, useEffect } from 'react';
import { EventBus } from '../game/EventBus';

export const GameUI: React.FC = () => {
    const [points, setPoints] = useState(0);
    const [hp, setHp] = useState(100);
    const [question, setQuestion] = useState({ q: '', a: 0 });
    const [options, setOptions] = useState<number[]>([]);

    // 問題を生成する関数
    const generateQuestion = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        setQuestion({ q: `${num1} + ${num2} = ?`, a: answer });
        
        // ダミーの選択肢を生成
        const opts = [answer];
        while(opts.length < 3) {
            const wrong = answer + Math.floor(Math.random() * 10) - 5;
            if (wrong !== answer && !opts.includes(wrong) && wrong > 0) {
                opts.push(wrong);
            }
        }
        setOptions(opts.sort(() => Math.random() - 0.5));
    };

    useEffect(() => {
        generateQuestion();

        // Phaserからのイベント受信
        EventBus.on('enemy-killed', () => {
            // 敵を倒したときのボーナスなどがあればここに
        });

        EventBus.on('base-damaged', (damage: number) => {
            setHp((prev) => Math.max(0, prev - damage));
        });

        return () => {
            EventBus.removeListener('enemy-killed');
            EventBus.removeListener('base-damaged');
        };
    }, []);

    const handleAnswer = (ans: number) => {
        if (ans === question.a) {
            // 正解
            setPoints((p) => p + 20);
            generateQuestion();
        } else {
            // 不正解
            // ペナルティを付ける場合はここに
        }
    };

    const buyTower = () => {
        if (points >= 50) {
            setPoints((p) => p - 50);
            EventBus.emit('buy-tower');
        }
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
            borderRadius: '10px'
        }}>
            {/* 上部ステータス */}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                <h2 style={{ margin: 0 }}>基地HP: {hp}</h2>
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
                    textAlign: 'center'
                }}>
                    <h3>{question.q}</h3>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
                    <p style={{ fontSize: '12px', marginTop: '5px' }}>※購入後、画面をクリックして配置</p>
                </div>
            </div>

            {hp <= 0 && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'red',
                    padding: '40px',
                    zIndex: 1000
                }}>
                    <h1 style={{ margin: 0, fontSize: '48px' }}>GAME OVER</h1>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '20px' }}>リトライ</button>
                </div>
            )}
        </div>
    );
};
