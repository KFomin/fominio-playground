import React from 'react';
import {observable, action} from 'mobx';
import {observer} from 'mobx-react';
import './Puzzle.css';

const Model = () => {
    return {
        imageUrl: observable.box(''),
        imagePieces: observable.array(),
    };
};

const Actions = (model) => {
    return {
        loadImage: action(function () {
            const cachedImageUrl = localStorage.getItem('puzzleImage');

            if (cachedImageUrl) {
                model.imageUrl.set(cachedImageUrl);
            } else {
                fetch('https://picsum.photos/1920/1080')
                    .then(response => {
                        const newImageUrl = response.url;
                        model.imageUrl.set(newImageUrl);
                        localStorage.setItem('puzzleImage', newImageUrl);
                    })
                    .catch(error => console.error('Error fetching image:', error));
            }
        }),

        cutImageIntoPieces: action(function (imageUrl) {
            const numColsToCut = 4;
            const numRowsToCut = 4;
            const widthOfOnePiece = 1920 / numColsToCut;
            const heightOfOnePiece = 1080 / numRowsToCut;

            const image = new Image();
            image.src = imageUrl;
            image.crossOrigin = 'anonymous';
            image.onload = action(() => { // Обернуть в action
                const canvasUrls = [];
                for (let x = 0; x < numColsToCut; ++x) {
                    for (let y = 0; y < numRowsToCut; ++y) {
                        const canvas = document.createElement('canvas');
                        canvas.width = widthOfOnePiece;
                        canvas.height = heightOfOnePiece;
                        const context = canvas.getContext('2d');

                        if (context) {
                            context.drawImage(
                                image,
                                x * widthOfOnePiece,
                                y * heightOfOnePiece,
                                widthOfOnePiece,
                                heightOfOnePiece,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );
                            canvasUrls.push(canvas.toDataURL());
                        }
                    }
                }

                const pieces = canvasUrls.map((url, index) => ({orderNo: index, url}));
                model.imagePieces.replace(pieces); // Заменяем текущие кусочки
            });
        }),
    };
};

const createPuzzleStore = () => {
    const model = Model();
    const actions = Actions(model);
    return {
        ...model,
        ...actions,
    };
};

const puzzleStore = createPuzzleStore();
puzzleStore.loadImage();
puzzleStore.cutImageIntoPieces(puzzleStore.imageUrl.get());

const Puzzle = observer(() => {
    return (
        <div className="puzzle-container">
            <div className={'pieces-container'}>
                {puzzleStore.imagePieces.map((piece, index) => (
                    <img
                        key={index}
                        src={piece.url}
                        alt={`Piece ${piece.orderNo}`}
                        title={String(piece.orderNo)}
                        className={'image-piece'}
                    />
                ))}
            </div>
            <div className={'image-container'}>
                {puzzleStore.imageUrl.get() && (
                    <img className={'image'}
                         ref={puzzleStore.imageRef}
                         src={puzzleStore.imageUrl.get()}
                         alt="Puzzle"/>
                )}
            </div>
        </div>
    );
});

export default Puzzle;
