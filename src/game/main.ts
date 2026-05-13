import Phaser, { Game as MainGame } from 'phaser';
import { MainScene } from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        MainScene
    ]
};

const StartGame = (parent: string) => {
    return new MainGame({ ...config, parent });
}

export default StartGame;
