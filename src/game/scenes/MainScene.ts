import Phaser, { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainScene extends Scene {
    enemies!: Phaser.GameObjects.Group;
    towers!: Phaser.GameObjects.Group;
    bullets!: Phaser.GameObjects.Group;
    
    nextEnemyTime: number = 0;
    placingTower: boolean = false;
    towerPreview!: Phaser.GameObjects.Arc;

    constructor() {
        super('MainScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d2d2d');

        // グループの作成
        this.enemies = this.add.group();
        this.towers = this.add.group();
        this.bullets = this.add.group();

        // ベース陣地（右側）
        const base = this.add.rectangle(750, 300, 100, 600, 0x0044ff, 0.3);
        this.physics.add.existing(base, true); // static

        // タワー配置のプレビュー
        this.towerPreview = this.add.circle(0, 0, 20, 0x00ff00, 0.5);
        this.towerPreview.setVisible(false);

        // マウス移動とクリックのイベント
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.placingTower) {
                this.towerPreview.setPosition(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.placingTower) {
                this.placeTower(pointer.x, pointer.y);
                this.placingTower = false;
                this.towerPreview.setVisible(false);
            }
        });

        // Reactからのイベント受け取り
        EventBus.on('buy-tower', () => {
            this.placingTower = true;
            this.towerPreview.setVisible(true);
        });

        // 衝突判定: 弾と敵
        this.physics.add.overlap(this.bullets, this.enemies, (bullet: any, enemy: any) => {
            bullet.destroy();
            enemy.hp -= 10;
            if (enemy.hp <= 0) {
                enemy.destroy();
                EventBus.emit('enemy-killed');
            }
        });

        // 準備完了イベント
        EventBus.emit('current-scene-ready', this);
    }

    update(time: number, _delta: number) {
        // 敵の生成
        if (time > this.nextEnemyTime) {
            this.spawnEnemy();
            this.nextEnemyTime = time + 2000; // 2秒ごとに生成
        }

        // 敵の移動とベース到達判定
        this.enemies.getChildren().forEach((child: any) => {
            const enemy = child as Phaser.GameObjects.Rectangle & { hp: number };
            enemy.x += 1; // 移動速度
            if (enemy.x > 700) {
                // ベースに到達
                enemy.destroy();
                EventBus.emit('base-damaged', 10); // ダメージ10
            }
        });

        // タワーの攻撃処理
        this.towers.getChildren().forEach((child: any) => {
            const tower = child as Phaser.GameObjects.Arc & { lastFired: number };
            if (time > tower.lastFired + 1000) { // 1秒に1回攻撃
                // 一番近い敵を探す
                let target: any = null;
                let minDistance = 150; // 射程距離
                
                this.enemies.getChildren().forEach((enemy: any) => {
                    const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        target = enemy;
                    }
                });

                if (target) {
                    this.fireBullet(tower.x, tower.y, target);
                    tower.lastFired = time;
                }
            }
        });
    }

    spawnEnemy() {
        const y = Phaser.Math.Between(100, 500);
        const enemy = this.add.rectangle(0, y, 30, 30, 0xff0000) as any;
        this.physics.add.existing(enemy);
        enemy.hp = 30; // 3発で倒せる
        this.enemies.add(enemy);
    }

    placeTower(x: number, y: number) {
        const tower = this.add.circle(x, y, 20, 0x00ff00) as any;
        tower.lastFired = 0;
        this.towers.add(tower);
    }

    fireBullet(x: number, y: number, target: any) {
        const bullet = this.add.circle(x, y, 5, 0xffff00) as any;
        this.physics.add.existing(bullet);
        this.bullets.add(bullet);
        this.physics.moveToObject(bullet, target, 300); // 弾の速度
    }
}
