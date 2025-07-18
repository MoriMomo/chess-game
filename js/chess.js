class ChessGame {
    constructor() {
        this.PIECES = {
            'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
            'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟︎'
        };
        this.SQUARES = {
            0: '8', 1: '7', 2: '6', 3: '5', 4: '4', 5: '3', 6: '2', 7: '1',
            a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7
        };
        this.hasKingMoved = { w: false, b: false };
        this.hasRookMoved = {
            w: { left: false, right: false },
            b: { left: false, right: false }
        };
        this.initialBoard = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
        this.boardState = [];
        this.currentPlayer = 'w';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameHistory = [];
        this.isGameOver = false;
    }

    startNewGame() {
        this.boardState = JSON.parse(JSON.stringify(this.initialBoard));
        this.currentPlayer = 'w';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameHistory = [];
        this.moveNotations = [];
        this.isGameOver = false;
        this.renderBoard();
        this.updateStatus();
        this.updateMoveHistory();
    }

    renderBoard() {
        const boardContainer = document.getElementById('board-container');
        boardContainer.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                square.className = `square ${isLight ? 'bg-stone-600' : 'bg-stone-800'}`;
                square.dataset.row = r;
                square.dataset.col = c;

                const piece = this.boardState[r][c];
                if (piece) {
                    square.textContent = this.PIECES[piece];
                    square.classList.add(piece[0] === 'w' ? 'text-stone-200' : 'text-amber-400');
                }

                if (this.selectedPiece && this.selectedPiece.row === r && this.selectedPiece.col === c) {
                    square.classList.add('bg-blue-700', 'ring-2', 'ring-blue-400');
                }

                if (this.validMoves.some(move => move.r === r && move.c === c)) {
                    square.classList.add('move-indicator');
                }

                boardContainer.appendChild(square);
            }
        }
        this.addEventListeners();
    }

    addEventListeners() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            square.addEventListener('click', () => {
                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);
                this.handleSquareClick(row, col);
            });
        });
    }

    handleSquareClick(row, col) {
        if (this.isGameOver) return;

        if (this.selectedPiece) {
            const isValidMove = this.validMoves.some(move => move.r === row && move.c === col);
            if (isValidMove) {
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
            } else {
                this.clearSelection();
                this.renderBoard();
            }
        } else {
            const piece = this.boardState[row][col];
            if (piece && piece[0] === this.currentPlayer) {
                this.selectPiece(row, col);
                this.renderBoard();
            }
        }
    }

    selectPiece(row, col) {
        this.selectedPiece = { row, col, piece: this.boardState[row][col] };
        this.validMoves = this.getValidMoves(row, col);
    }

    clearSelection() {
        this.selectedPiece = null;
        this.validMoves = [];
    }

    getSquareNotation(r, c) {
        const file = String.fromCharCode(97 + c); // Convert 0-7 to a-h
        const rank = 8 - r; // Convert 0-7 to 8-1
        return file + rank;
    }

    getMoveNotation(fromR, fromC, toR, toC, piece, isCapture, isCheck, isCheckmate) {
        const pieceSymbol = piece[1] === 'P' ? '' : piece[1];
        const captureSymbol = isCapture ? 'x' : '';
        const toSquare = this.getSquareNotation(toR, toC);

        let notation = '';

        // Handle castling
        if (piece[1] === 'K' && Math.abs(toC - fromC) === 2) {
            return toC > fromC ? 'O-O' : 'O-O-O';
        }

        notation = `${pieceSymbol}${this.getSquareNotation(fromR, fromC)}${captureSymbol}${toSquare}`;

        // Add check or checkmate symbol
        if (isCheckmate) notation += '#';
        else if (isCheck) notation += '+';

        return notation;
    }

    movePiece(fromR, fromC, toR, toC) {
        this.gameHistory.push(JSON.parse(JSON.stringify(this.boardState)));
        const piece = this.boardState[fromR][fromC];
        const isCapture = this.boardState[toR][toC] !== null;
        const color = piece[0];
        const pieceType = piece[1];

        if (pieceType === 'K') {
            this.hasKingMoved[color] = true;
            if (Math.abs(toC - fromC) === 2) {
                const isKingSide = toC > fromC;
                const rookFromC = isKingSide ? 7 : 0;
                const rookToC = isKingSide ? 5 : 3;
                this.boardState[toR][rookToC] = this.boardState[toR][rookFromC];
                this.boardState[toR][rookFromC] = null;
            }
        } else if (pieceType === 'R') {
            if (fromC === 0) this.hasRookMoved[color].left = true;
            if (fromC === 7) this.hasRookMoved[color].right = true;
        }

        if (piece === 'wP' && toR === 0) this.boardState[toR][toC] = 'wQ';
        else if (piece === 'bP' && toR === 7) this.boardState[toR][toC] = 'bQ';
        else this.boardState[toR][toC] = piece;

        this.boardState[fromR][fromC] = null;

        this.clearSelection();
        this.switchPlayer();
        this.renderBoard();

        const isCheck = this.isCheck(this.currentPlayer);
        const isCheckmate = this.isCheckmate(this.currentPlayer);

        // Record the move
        const moveNotation = this.getMoveNotation(fromR, fromC, toR, toC, piece, isCapture, isCheck, isCheckmate);
        this.moveNotations.push(moveNotation);
        this.updateMoveHistory();

        if (isCheckmate) {
            this.isGameOver = true;
            this.updateStatus(`Checkmate! ${this.currentPlayer === 'w' ? 'Black' : 'White'} wins.`);
        } else if (this.isStalemate(this.currentPlayer)) {
            this.isGameOver = true;
            this.updateStatus('Stalemate! The game is a draw.');
        } else if (isCheck) {
            this.updateStatus(`${this.currentPlayer === 'w' ? 'White' : 'Black'} is in check.`);
        } else {
            this.updateStatus();
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';
    }

    updateStatus(message) {
        const statusText = document.getElementById('status-text');
        if (this.isGameOver && message) {
            statusText.textContent = message;
            return;
        }
        if (message) {
            statusText.textContent = message;
            setTimeout(() => {
                if (!this.isGameOver) this.updateStatus();
            }, 2000);
        } else {
            statusText.textContent = `${this.currentPlayer === 'w' ? 'White' : 'Black'}'s Turn`;
        }
    }

    getValidMoves(r, c) {
        const piece = this.boardState[r][c];
        if (!piece) return [];

        const moves = [];
        const pieceType = piece.substring(1);
        const color = piece[0];

        function addMove(targetR, targetC, isCaptureOnly = false, isMoveOnly = false) {
            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                const targetPiece = this.boardState[targetR][targetC];
                if (isMoveOnly && targetPiece !== null) return false;
                if (isCaptureOnly && (targetPiece === null || targetPiece[0] === color)) return false;
                if (targetPiece === null || targetPiece[0] !== color) {
                    moves.push({ r: targetR, c: targetC });
                    return targetPiece === null;
                }
            }
            return false;
        }

        switch (pieceType) {
            case 'P':
                const direction = color === 'w' ? -1 : 1;
                const startRow = color === 'w' ? 6 : 1;
                addMove.call(this, r + direction, c, false, true);
                if (r === startRow && this.boardState[r + direction][c] === null) {
                    addMove.call(this, r + 2 * direction, c, false, true);
                }
                addMove.call(this, r + direction, c - 1, true);
                addMove.call(this, r + direction, c + 1, true);
                break;
            case 'N':
                [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
                    .forEach(d => addMove.call(this, r + d[0], c + d[1]));
                break;
            case 'B':
            case 'R':
            case 'Q':
                const directions = {
                    'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
                    'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
                    'Q': [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
                }[pieceType];
                directions.forEach(d => {
                    for (let i = 1; i < 8; i++) {
                        if (!addMove.call(this, r + i * d[0], c + i * d[1])) break;
                    }
                });
                break;
            case 'K':
                [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
                    .forEach(d => addMove.call(this, r + d[0], c + d[1]));

                if (!this.hasKingMoved[color] && !this.isCheck(color)) {
                    if (!this.hasRookMoved[color].right &&
                        !this.boardState[r][5] && !this.boardState[r][6] &&
                        !this.isSquareAttacked(r, 5, color) && !this.isSquareAttacked(r, 6, color)) {
                        addMove.call(this, r, c + 2);
                    }
                    if (!this.hasRookMoved[color].left &&
                        !this.boardState[r][1] && !this.boardState[r][2] && !this.boardState[r][3] &&
                        !this.isSquareAttacked(r, 2, color) && !this.isSquareAttacked(r, 3, color)) {
                        addMove.call(this, r, c - 2);
                    }
                }
                break;
        }

        return moves.filter(move => {
            const tempBoard = JSON.parse(JSON.stringify(this.boardState));
            tempBoard[move.r][move.c] = tempBoard[r][c];
            tempBoard[r][c] = null;
            return !this.isKingInCheck(color, tempBoard);
        });
    }

    isKingInCheck(kingColor, board) {
        const kingPos = this.findKing(kingColor, board);
        if (!kingPos) return true;

        const opponentColor = kingColor === 'w' ? 'b' : 'w';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece[0] === opponentColor) {
                    const moves = this.getBasicMoves(r, c, board);
                    if (moves.some(m => m.r === kingPos.r && m.c === kingPos.c)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    findKing(color, board) {
        const kingPiece = color + 'K';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === kingPiece) return { r, c };
            }
        }
        return null;
    }

    getBasicMoves(r, c, board) {
        const piece = board[r][c];
        const moves = [];
        const pieceType = piece.substring(1);
        const color = piece[0];

        function addMove(targetR, targetC) {
            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                const targetPiece = board[targetR][targetC];
                if (targetPiece === null || targetPiece[0] !== color) {
                    moves.push({ r: targetR, c: targetC });
                    return targetPiece === null;
                }
            }
            return false;
        }

        switch (pieceType) {
            case 'P':
                const direction = color === 'w' ? -1 : 1;
                if (c > 0) moves.push({ r: r + direction, c: c - 1 });
                if (c < 7) moves.push({ r: r + direction, c: c + 1 });
                break;
            case 'N':
                [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
                    .forEach(d => moves.push({ r: r + d[0], c: c + d[1] }));
                break;
            case 'B':
            case 'R':
            case 'Q':
                const directions = {
                    'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
                    'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
                    'Q': [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
                }[pieceType];
                directions.forEach(d => {
                    for (let i = 1; i < 8; i++) {
                        if (!addMove(r + i * d[0], c + i * d[1])) break;
                    }
                });
                break;
            case 'K':
                [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
                    .forEach(d => moves.push({ r: r + d[0], c: c + d[1] }));
                break;
        }
        return moves;
    }

    isCheck(color) {
        return this.isKingInCheck(color, this.boardState);
    }

    isSquareAttacked(r, c, defenderColor) {
        const attackerColor = defenderColor === 'w' ? 'b' : 'w';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.boardState[row][col];
                if (piece && piece[0] === attackerColor) {
                    const moves = this.getBasicMoves(row, col, this.boardState);
                    if (moves.some(m => m.r === r && m.c === c)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isStalemate(color) {
        if (this.isCheck(color)) return false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c] && this.boardState[r][c][0] === color) {
                    if (this.getValidMoves(r, c).length > 0) return false;
                }
            }
        }
        return true;
    }

    isCheckmate(color) {
        if (!this.isCheck(color)) return false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c] && this.boardState[r][c][0] === color) {
                    if (this.getValidMoves(r, c).length > 0) return false;
                }
            }
        }
        return true;
    }

    updateMoveHistory() {
        const moveList = document.getElementById('move-list');
        moveList.innerHTML = '';

        for (let i = 0; i < this.moveNotations.length; i++) {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry' + (i === this.moveNotations.length - 1 ? ' latest' : '');

            const moveNumber = document.createElement('span');
            moveNumber.className = 'move-number';
            moveNumber.textContent = `${Math.floor(i / 2) + 1}.${i % 2 === 0 ? '' : '.'}`;

            const moveNotation = document.createElement('span');
            moveNotation.className = 'move-notation';
            moveNotation.textContent = this.moveNotations[i];

            moveEntry.appendChild(moveNumber);
            moveEntry.appendChild(moveNotation);
            moveList.appendChild(moveEntry);
        }

        // Scroll to the latest move
        moveList.scrollTop = moveList.scrollHeight;
    }
}

// Initialize game
const game = new ChessGame();
document.getElementById('new-game-button').addEventListener('click', () => game.startNewGame());
window.onload = () => game.startNewGame();
