/**
 * 神経衰弱（Memory Card Game） ロジック
 */

// === 状態管理 ===
let currentLevel = 'easy';
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 0;
let flipsCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;
let lockBoard = false;

// === 画像リスト（25枚） ===
// imagesフォルダにある25枚の画像を定義します。
const imagePool = [
    'foodJa.jpg', 'foodKa.jpg', 'foodNi.jpg', 'foodSa.jpg',
    'fuu.jpg', 'fuu2.jpg', 'man.jpg', 'man2.jpg',
    'mih.jpg', 'mih2.jpg', 'mik.jpg', 'mik2.jpg',
    'noz.jpg', 'noz2.jpg', 'reoma1.jpg', 'reoma2.jpg', 'reoma3.jpg',
    'tok.jpg', 'tok2.jpg', 'tom.jpg', 'tom2.jpg',
    'you.jpg', 'you2.jpg', 'yuu.jpg', 'yuu2.jpg'
];

// === レベル設定 ===
const levels = {
    easy: { columns: 4, rows: 4, pairs: 8 },    // 16枚
    normal: { columns: 5, rows: 4, pairs: 10 },  // 20枚
    hard: { columns: 6, rows: 4, pairs: 12 }     // 24枚 (6x4)
};

// === DOM要素の取得 ===
const levelSelectionModal = document.getElementById('level-selection');
const gameOverModal = document.getElementById('game-over');
const gameContainer = document.getElementById('game-container');
const gameBoard = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer');
const flipsDisplay = document.getElementById('flips');
const restartBtn = document.getElementById('restart-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const finalTimeDisplay = document.getElementById('final-time');
const finalFlipsDisplay = document.getElementById('final-flips');
const levelButtons = document.querySelectorAll('.level-btn');

// === イベントリスナーの登録 ===
// レベル選択ボタン
levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const selectedLevel = btn.getAttribute('data-level');
        startGame(selectedLevel);
    });
});

// リスタートボタン
restartBtn.addEventListener('click', () => {
    if (confirm('ゲームをやり直しますか？')) {
        startGame(currentLevel);
    }
});

// クリア画面からメニューへ戻るボタン
backToMenuBtn.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
    setTimeout(() => {
        gameOverModal.classList.add('hidden');
        gameContainer.classList.add('hidden');
        levelSelectionModal.classList.remove('hidden');
        // 少し遅延を入れてアニメーション効果を出す
        setTimeout(() => {
            levelSelectionModal.classList.add('active');
        }, 50);
    }, 300);
});

// === 効果音再生（ダミー） ===
// ※ 将来的に音声を追加しやすいように関数として用意しています
function playSound(type) {
    // 例:
    // const audio = new Audio(`sounds/${type}.mp3`);
    // audio.play().catch(e => console.log('Audio play blocked'));
    // 今回はコンソール出力のみとしています
    console.log(`Sound effect: ${type}`);
}

// === ゲームの初期化と開始 ===
function startGame(level) {
    currentLevel = level;
    totalPairs = levels[level].pairs;
    matchedPairs = 0;
    flipsCount = 0;
    secondsElapsed = 0;
    flippedCards = [];
    lockBoard = false;
    isPlaying = true;

    // UIの初期化
    updateStats();
    resetTimer();
    startTimer();

    // 画面の切り替え
    levelSelectionModal.classList.remove('active');
    setTimeout(() => {
        levelSelectionModal.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        // ボードの生成
        generateBoard();
    }, 300); // CSSのトランジション時間と合わせる
}

// === タイマー処理 ===
function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateStats();
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateStats() {
    // 試行回数の更新
    flipsDisplay.textContent = flipsCount;
    
    // タイマーの更新（MM:SS形式）
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = formattedTime;
}

// === 配列のシャッフル（Fisher-Yatesアルゴリズム） ===
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// === ボードの生成 ===
function generateBoard() {
    // 既存のカードをクリア
    gameBoard.innerHTML = '';
    
    // クラスの切り替え（CSS Gridのレイアウト変更）
    gameBoard.className = `board ${currentLevel}`;
    
    // 画像の選択（プールから必要なペア数をランダムに抽出）
    const shuffledPool = shuffleArray(imagePool);
    const selectedImages = shuffledPool.slice(0, totalPairs);
    
    // 抽出した画像からペアを作成し、さらにシャッフル
    cards = shuffleArray([...selectedImages, ...selectedImages]);
    
    // カード要素の生成とDOMへの追加
    cards.forEach((image, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        // マッチ判定用に画像ファイル名をデータ属性に保存
        cardElement.dataset.image = image;
        
        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');
        
        // 表面（最初に見える方、カバー画像）
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        const imgFront = document.createElement('img');
        imgFront.src = 'images/face.jpg';
        imgFront.alt = 'Cover';
        cardFront.appendChild(imgFront);
        
        // 裏面（めくったときに見える画像）
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        const imgBack = document.createElement('img');
        imgBack.src = `images/${image}`;
        imgBack.alt = 'Card Image';
        cardBack.appendChild(imgBack);
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);
        
        // クリックイベントの追加
        cardElement.addEventListener('click', () => flipCard(cardElement));
        
        gameBoard.appendChild(cardElement);
    });
}

// === カードをめくる処理 ===
function flipCard(card) {
    // 盤面がロックされているか、すでにめくられている・マッチしているカードなら何もしない
    if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    // フリップ効果音
    playSound('flip');

    // カードをめくる
    card.classList.add('flipped');
    flippedCards.push(card);

    // 2枚めくられたら判定処理へ
    if (flippedCards.length === 2) {
        flipsCount++;
        updateStats();
        checkForMatch();
    }
}

// === マッチ判定 ===
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.image === card2.dataset.image;

    if (isMatch) {
        // --- マッチした場合 ---
        playSound('match');
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];

        // 全てマッチしたかチェック
        if (matchedPairs === totalPairs) {
            handleGameClear();
        }
    } else {
        // --- マッチしなかった場合 ---
        lockBoard = true; // 他のカードをめくれないようにロック
        playSound('miss');
        
        // 1秒待ってからカードを裏返す
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            lockBoard = false; // ロック解除
        }, 1000);
    }
}

// === ゲームクリア処理 ===
function handleGameClear() {
    isPlaying = false;
    resetTimer();
    playSound('clear');

    // 最終スコアの反映
    finalTimeDisplay.textContent = timerDisplay.textContent;
    finalFlipsDisplay.textContent = flipsCount;

    // 少し待ってからクリアモーダルを表示
    setTimeout(() => {
        gameOverModal.classList.remove('hidden');
        // 少し遅延を入れてアニメーション効果を出す
        setTimeout(() => {
            gameOverModal.classList.add('active');
            createConfetti(); // 祝福の花吹雪アニメーション
        }, 50);
    }, 800);
}

// === 花吹雪（紙吹雪）アニメーション ===
function createConfetti() {
    const colors = ['#ffcc66', '#ff99cc', '#66ccff', '#99cc66', '#cc99ff'];
    
    // 100枚の紙吹雪を生成
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        
        // ランダムな色、サイズ、位置
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 8 + 'px';
        const left = Math.random() * 100 + 'vw';
        
        confetti.style.backgroundColor = color;
        confetti.style.width = size;
        confetti.style.height = size;
        confetti.style.left = left;
        confetti.style.top = '-20px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'; // 丸か四角
        confetti.style.zIndex = '1000';
        confetti.style.pointerEvents = 'none';
        
        // アニメーション設定
        const duration = Math.random() * 3 + 2; // 2~5秒
        const delay = Math.random() * 2; // 0~2秒遅延
        
        confetti.style.transition = `top ${duration}s ease-in, transform ${duration}s ease-in, opacity ${duration}s ease-in`;
        
        document.body.appendChild(confetti);
        
        // アニメーション実行（CSSのトランジションを利用）
        setTimeout(() => {
            confetti.style.top = '100vh';
            confetti.style.transform = `rotate(${Math.random() * 360}deg) translateX(${Math.random() * 100 - 50}px)`;
            confetti.style.opacity = '0';
        }, delay * 1000 + 50);
        
        // アニメーション終了後にDOMから削除
        setTimeout(() => {
            confetti.remove();
        }, (duration + delay) * 1000 + 100);
    }
}
