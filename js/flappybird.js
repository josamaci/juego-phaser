var initFlag = true;

class StartScene extends Phaser.Scene {
    constructor() {
        super("startScene");
    }

    preload() {
        this.load.image('sky', 'assets/background.png');
        this.load.audio('music', 'assets/music.mp3'); 
    }

    create() {
        // Fondo con movimiento
        this.bg = this.add.tileSprite(this.cameras.main.centerX, this.cameras.main.centerY, 1920, 1200, 'sky').setScrollFactor(0);
        this.bg.setScale(this.cameras.main.width / 1920, this.cameras.main.height / 1200);

        // Título del juego
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'Jueguito :3', {
            fontSize: '64px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000', 
            strokeThickness: 6 
        }).setOrigin(0.5);

        // Botón para iniciar el juego
        const startButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Iniciar Juego', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000', 
            strokeThickness: 4 
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start("gameScene");
        });

        // Botón para activar/desactivar música
        this.musicButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Música: '+(this.isMusicOn ? "ON" : "OFF"), {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000', 
            strokeThickness: 4 
        }).setOrigin(0.5).setInteractive();

        this.musicButton.on('pointerdown', () => {
            this.toggleMusic();
        });

        if(initFlag){
            this.music = this.sound.add('music', { loop: true });
            this.isMusicOn = false; 
            initFlag = false;
        }
    }

    toggleMusic() {
        if (this.isMusicOn) {
            this.music.pause(); // Pausar la música en lugar de detenerla
            this.musicButton.setText('Música: OFF');
        } else {
            if (this.music.isPaused) {
                this.music.resume(); // Reanudar la música si estaba pausada
            } else {
                this.music.play(); // Reproducir la música si no estaba en pausa
            }
            this.musicButton.setText('Música: ON');
        }
        this.isMusicOn = !this.isMusicOn;
    }

    update(time) {
        this.bg.tilePositionX = time * 0.1; // Mover el fondo
    }
}

class Flappy extends Phaser.Scene {
    constructor() {
        super("gameScene");
        this.score = 0;
    }

    preload() {
        this.load.image('sky', 'assets/background.png');
        this.load.image('pipe', 'assets/pipe.png');
        this.load.image('pipesup', 'assets/pipesup.png');
        this.load.image('white-smoke', 'assets/white-smoke.png');
        this.load.spritesheet('flyer', 'assets/bird.png', { frameWidth: 1200, frameHeight: 1200 });
        //this.load.spritesheet('flyer', 'assets/pig.png', { frameWidth: 542, frameHeight: 323 });
    }

    create() {
        this.score = 0;
        this.bg = this.add.tileSprite(this.cameras.main.centerX, this.cameras.main.centerY, 1920, 1200, 'sky').setScrollFactor(0);
        this.bg.setScale(this.cameras.main.width / 1920, this.cameras.main.height / 1200);
        this.emitter = this.add.particles(0, 0, 'white-smoke', {
            speed: 26, lifespan: 500, quantity: 1, scale: { start: 0.4, end: 0 }, emitting: false
          })

        this.generatePlayer();
        this.generatePipes();

        this.physics.world.on('worldbounds', (body) => {
            this.scene.start('endScene', { score: this.score });
        });

        this.player.setCollideWorldBounds(true);
        this.player.body.onWorldBounds = true;

        this.scoreText = this.add.text(this.cameras.main.centerX, 20, 'Puntos: 0', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000', 
            strokeThickness: 4 
        });

        this.scoreText.setDepth(10000);
    }

    update(time) {
        this.bg.tilePositionX = time * 0.1;
        if (this.player.body.velocity.y > 0) {
            this.player.rotation = Phaser.Math.DegToRad(20);
        } else {
            this.player.rotation = Phaser.Math.DegToRad(0);
        }
        if (this.pipes!=null && this.pipes.getChildren!=null){
            this.pipes.getChildren().forEach(pipe => {
                if (!pipe.scored && pipe.x < this.player.x) {
                    pipe.scored = true; 
                    this.updateScore(); 
                }
            });
        }
    }

    generatePlayer() {
        this.player = this.physics.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'flyer').setScale(0.05).refreshBody();
        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('flyer', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.player.play('fly');

        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 32) {
                this.jump();
            }
        });

        this.input.on('pointerdown', () => this.jump());
    }

    generatePipes() {
        const playerHeight = this.player.displayHeight;
        const gap = playerHeight * 3;

        const minY = (window.innerHeight / 0.8);
        const maxY = (window.innerHeight / 1.6);
        const valor = Phaser.Math.Between(minY, maxY);

        const pipe = this.physics.add.group();

        const e1 = pipe.create(this.cameras.main.width, valor, 'pipe').setScale(0.25, 0.25);
        e1.body.allowGravity = false;

        const e2 = pipe.create(this.cameras.main.width, valor - gap - e1.displayHeight, 'pipesup').setScale(0.25, 0.25);
        e2.body.allowGravity = false;

        const pipeSpeed = -300 * (this.cameras.main.width / 1440);
        pipe.setVelocityX(pipeSpeed);

        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;

        this.physics.add.overlap(this.player, pipe, this.hitPipe, null, this);


        pipe.children.each((p) => {
            p.scored = false; 
        });

        this.pipes = pipe;
        this.time.delayedCall(3000, this.generatePipes, [], this);
    }

    hitPipe() {
        this.scene.start("endScene", { score: this.score });
    }

    jump() {
        this.player.setVelocityY(-(window.innerHeight / 3));
        this.emitter.emitParticleAt(this.player.getBottomLeft().x + 8.5, this.player.getBottomLeft().y - 7.5);
    }

    updateScore() {
        this.score++;
        this.scoreText.setText(`Puntos: ${this.score}`);
    }
}

class End extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    create(data) {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'sky').setScale(this.cameras.main.width / 1920, this.cameras.main.height / 1200);

        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, `Puntuación: ${data.score}`, {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000', 
            strokeThickness: 4 
        }).setOrigin(0.5);

        const restartButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, 'Volver al Inicio', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000', 
            strokeThickness: 4 
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.start("startScene");
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [StartScene, Flappy, End],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 }
        }
    }
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});