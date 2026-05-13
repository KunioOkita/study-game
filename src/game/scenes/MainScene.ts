import Phaser, { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainScene extends Scene {
    enemies!: Phaser.GameObjects.Group;
    towers!: Phaser.GameObjects.Group;
    bullets!: Phaser.GameObjects.Group;
    
    nextEnemyTime: number = 0;
    placingTower: boolean = false;
    towerPreview!: Phaser.GameObjects.Image;
    currentLevel: number = 1;

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('background', '/assets/background.png');
        this.load.image('base', '/assets/base.png');
        this.load.image('enemy', '/assets/enemy.png');
        this.load.image('tower', '/assets/tower.png');
        this.load.image('bullet', '/assets/bullet.png');
    }

    create() {
        const bg = this.add.image(400, 200, 'background');
        bg.setDisplaySize(800, 400);

        // グループの作成
        this.enemies = this.add.group();
        this.towers = this.add.group();
        this.bullets = this.add.group();

        // ベース陣地（右側）
        const base = this.add.image(750, 200, 'base');
        base.setDisplaySize(100, 400);
        this.physics.add.existing(base, true); // static

        // タワー配置のプレビュー
        this.towerPreview = this.add.image(0, 0, 'tower');
        this.towerPreview.setDisplaySize(60, 60);
        this.towerPreview.setAlpha(0.5);
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

        EventBus.on('change-difficulty', (level: number) => {
            this.currentLevel = level;
        });

        // 衝突判定: 弾と敵
        this.physics.add.overlap(this.bullets, this.enemies, (bullet: any, enemy: any) => {
            this.createHitEffect(bullet.x, bullet.y);
            bullet.destroy();
            enemy.hp -= 10;
            
            // ダメージ表現（一瞬だけ白く光らせる）
            enemy.setTintFill(0xffffff);
            this.time.delayedCall(100, () => {
                if (enemy && enemy.active) {
                    enemy.clearTint();
                }
            });

            if (enemy.hp <= 0) {
                this.createExplosion(enemy.x, enemy.y);
                enemy.destroy();
                EventBus.emit('enemy-killed');
            }
        });

        // 準備完了イベント
        EventBus.emit('current-scene-ready', this);
    }

    update(time: number, _delta: number) {
        // 敵の生成
        const spawnInterval = 2000 - (this.currentLevel - 1) * 150;
        if (time > this.nextEnemyTime) {
            this.spawnEnemy();
            this.nextEnemyTime = time + spawnInterval;
        }

        // 敵の移動とベース到達判定
        const speed = 1 + (this.currentLevel - 1) * 0.2;
        this.enemies.getChildren().forEach((child: any) => {
            const enemy = child as Phaser.GameObjects.Image & { hp: number };
            enemy.x += speed; // 移動速度
            if (enemy.x > 700) {
                // ベースに到達
                enemy.destroy();
                EventBus.emit('base-damaged', 10); // ダメージ10
            }
        });

        // タワーの攻撃処理
        this.towers.getChildren().forEach((child: any) => {
            const tower = child as Phaser.GameObjects.Image & { lastFired: number };
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
        const y = Phaser.Math.Between(50, 350);
        const enemy = this.add.image(0, y, 'enemy') as any;
        enemy.setDisplaySize(50, 50);
        this.physics.add.existing(enemy);
        enemy.body.setSize(enemy.width * 0.6, enemy.height * 0.6);
        enemy.body.setOffset(enemy.width * 0.2, enemy.height * 0.2);
        enemy.hp = 30; // 3発で倒せる
        this.enemies.add(enemy);
    }

    placeTower(x: number, y: number) {
        const tower = this.add.image(x, y, 'tower') as any;
        tower.setDisplaySize(60, 60);
        tower.lastFired = 0;
        this.towers.add(tower);
    }

    fireBullet(x: number, y: number, target: any) {
        const bullet = this.add.image(x, y, 'bullet') as any;
        bullet.setDisplaySize(20, 20);
        this.physics.add.existing(bullet);
        bullet.body.setCircle(bullet.width * 0.3, bullet.width * 0.2, bullet.width * 0.2);
        this.bullets.add(bullet);
        this.physics.moveToObject(bullet, target, 300); // 弾の速度
    }

    createExplosion(x: number, y: number) {
        const emitter = this.add.particles(x, y, 'bullet', {
            speed: { min: 100, max: 300 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false
        });
        emitter.explode(15);
        
        this.time.delayedCall(500, () => {
            emitter.destroy();
        });
    }

    createHitEffect(x: number, y: number) {
        const emitter = this.add.particles(x, y, 'bullet', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 200,
            blendMode: 'ADD',
            emitting: false
        });
        emitter.explode(5); // 小さな爆発（5パーティクル）
        
        this.time.delayedCall(300, () => {
            emitter.destroy();
        });
    }
}
