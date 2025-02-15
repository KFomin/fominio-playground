import React from "react";
import './Home.css';

export default function Home() {
    return (
        <div className={'app'}>
            <ul className={'games'}>
                <li>
                    <a className={'game'} href={'/puzzle'}>Puzzle Game</a>
                </li>
            </ul>
        </div>
    );
}
