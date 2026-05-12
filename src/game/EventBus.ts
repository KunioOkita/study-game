import { Events } from 'phaser';

// ReactとPhaserの間でイベントをやり取りするためのグローバルなEventBus
export const EventBus = new Events.EventEmitter();
