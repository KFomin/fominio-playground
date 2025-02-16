import React, {useEffect, useRef} from 'react';
import {observable, action} from 'mobx';
import {observer} from 'mobx-react';
import './Puzzle.css';
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {HTML5Backend} from 'react-dnd-html5-backend';

const Model = () => {
    return {
        imageUrl: observable.box(''),
        imagePieces: observable.array(),
        imageWidth: observable.box(1920),
        imageHeight: observable.box(1080),
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
            image.onload = action(() => {
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
                model.imagePieces.replace(pieces);
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

const ImagePiece = observer(({piece, index, movePiece}) => {
    const [{isDragging}, drag] = useDrag(() => ({
        type: 'IMAGE_PIECE',
        item: {index},
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [, drop] = useDrop(() => ({
        accept: 'IMAGE_PIECE',
        hover(item) {
            if (item.index !== index) {
                movePiece(item.index, index);
                item.index = index;
            }
        },
    }));

    return (
        <img
            ref={(node) => drag(drop(node))}
            src={piece.url}
            alt={`Piece ${piece.orderNo}`}
            title={String(piece.orderNo)}
            style={{opacity: isDragging ? 0.5 : 1, width: puzzleStore.imageWidth.get() / 4, height: puzzleStore.imageHeight.get() / 4}}
        />
    );
});

const GridCell = ({index, drop}) => {
    const [, ref] = useDrop({
        accept: 'IMAGE_PIECE',
        drop: (item) => {
            console.log(`Dropped piece ${item.index} in cell ${index}`);
        },
    });

    return (
        <div ref={ref} className="grid-cell">
            {/* Cell logic */}
        </div>
    );
};

const Puzzle = observer(() => {
    const movePiece = (fromIndex, toIndex) => {
        const pieces = puzzleStore.imagePieces.slice();
        const [movedPiece] = pieces.splice(fromIndex, 1);
        pieces.splice(toIndex, 0, movedPiece);
        puzzleStore.imagePieces.replace(pieces);
    };

    const imageRef = useRef(null);
    const gridRef = useRef(null);

    const setSizes = () => {
        if (imageRef.current && gridRef.current) {
            const {clientWidth: width, clientHeight: height} = imageRef.current;
            puzzleStore.imageWidth.set(width);
            puzzleStore.imageHeight.set(height);
            gridRef.current.style.width = `${width}px`;
            gridRef.current.style.height = `${height}px`;
        }
    }

    const numCols = 4;
    const numRows = 4;

    useEffect(() => {
        window.addEventListener('resize', setSizes);
        window.addEventListener('load', setSizes);
        return () => {
            window.removeEventListener('resize', setSizes);
            window.removeEventListener('load', setSizes);
        };
    }, []);


    return (
        <DndProvider backend={HTML5Backend}>
            <div className="puzzle-container">
                <div className={'pieces-container'}>
                    {puzzleStore.imagePieces.map((piece, index) => (
                        <ImagePiece
                            key={index}
                            piece={piece}
                            index={index}
                            movePiece={movePiece}
                        />
                    ))}
                </div>
                <div className={'image-container'} style={{position: 'relative'}}>
                    {puzzleStore.imageUrl.get() && (
                        <img
                            ref={imageRef}
                            className={'image'}
                            src={puzzleStore.imageUrl.get()}
                            style={{opacity: 0}}
                            alt="Puzzle"
                        />
                    )}
                    <div
                        ref={gridRef}
                        className="grid"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
                            gridTemplateRows: `repeat(${numRows}, 1fr)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {Array.from({length: numRows * numCols}).map((_, index) => (
                            <GridCell key={index} index={index}/>
                        ))}
                    </div>
                </div>
            </div>
        </DndProvider>
    );
});

export default Puzzle;
