import React, { useState, useEffect } from "react";

import io from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const socket = io(API_BASE); 

import { FaFire } from "react-icons/fa"
import { FiTrash } from "react-icons/fi"
import { FiPlus } from "react-icons/fi"
import  { motion } from "motion/react"

export default function Kanban(){
    useEffect(() => {
            const fetchData = () => {
            fetch(`${API_BASE}/api/kanban`)
                .then(res => res.json())
                .then(data => {
                setCards(data);
                })
                .catch(err => {
                console.error("Error fetching time logs:", err);
                });
            };
    
            fetchData(); // Initial load
    
            // Subscribe to live updates
            socket.on('new-entry', () => {
            fetchData(); // refresh data when new entry is pushed
            });
    
            return () => socket.off('new-entry'); // Clean up
        }, []);

    const [cards, setCards] = useState([])

    console.log(cards)

    return(
        <div className="flex inset-shadow-sm/80 bg-black/30 h-200 gap-4 custom-scroll overflow-auto rounded-lg p-4">
            <Column
                title="Backlog"
                status="backlog"
                headingColor="text-neutral-300"
                bgColor="bg-neutral-500/30"
                cards={cards}
                setCards={setCards}
            />
 
            <Column
                title="To-Do"
                status="todo"
                headingColor="text-yellow-300"
                bgColor="bg-yellow-500/30"
                cards={cards}
                setCards={setCards}
            />
 
            <Column
                title="In Progress"
                status="doing"
                headingColor="text-blue-300"
                bgColor="bg-blue-500/30"
                cards={cards}
                setCards={setCards}
            />
 
            <Column
                title="Complete"
                status="done"
                headingColor="text-emerald-300"
                bgColor="bg-emerald-500/30"
                cards={cards}
                setCards={setCards}
            />

            <BurnBarrel setCards={setCards}/>
        </div>
    )
}

const Column = ({ title, headingColor, bgColor , status, cards, setCards }) => {

    const [active, setActive] = useState(false)

    const handleDragStart = (e, card) => {
        console.log("Drag Start", card);
        e.dataTransfer.setData("cardId", card.id.toString())
    }
    const handleDragOver = (e) => {
        e.preventDefault()
        highlightIndicator(e)
        setActive(true)
    }
    const handleDragLeave = (e) => {
        setActive(false)
        clearHighlights()
    }
    const handleDrop = async (e) => {
        setActive(false)
        clearHighlights()

        const cardId = e.dataTransfer.getData("cardId")

        console.log(cardId)

        const indicators = getIndicators()
        const { element } = getNearestIndicators(e, indicators)

        const before = element.dataset.before || "-1"

        if (before !== cardId){
            let copy = [...cards]

            let cardToTransfer = copy.find((c) => c.id === Number(cardId))
            if(!cardToTransfer) return

            cardToTransfer = { ...cardToTransfer, status }

            copy = copy.filter((c) => c.id !== Number(cardId))

            const moveToBack = before === "-1"

            if(moveToBack){
                copy.push(cardToTransfer)
            } else {
                const insertAtIndex = copy.findIndex((el) => 
                    el.id === before)
                if (insertAtIndex === undefined) return

                copy.splice(insertAtIndex, 0, cardToTransfer)
            }

            try {
                const response = await fetch(`${API_BASE}/api/kanban/${cardToTransfer.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cardToTransfer),
            });

                if (!response.ok) throw new Error("Update failed");

                const updated = await response.json();
                console.log("Updated:", updated);
            } catch (err) {
                console.error("Error updating card:", err);
            }
            setCards(copy)
        }
    }

    const highlightIndicator = (e) => {
        const indicators = getIndicators();
        clearHighlights(indicators)
        const el = getNearestIndicators(e, indicators)
        el.element.style.opacity = "1"
    }
    const clearHighlights = (els) => {
        const indicators = els || getIndicators()

        indicators.forEach((i) => {
            i.style.opacity = "0"
        })
    }
    const getNearestIndicators = (e, indicators) => {

        const DISTANCE_OFFSET = 50

        const el = indicators.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect()
                const offset = e.clientY - (box.top + DISTANCE_OFFSET)

                if (offset < 0 && offset > closest.offset){
                    return {offset: offset, element: child}
                }else{
                    return closest
                }
            }, {
                offset: Number.NEGATIVE_INFINITY,
                element: indicators[indicators.length - 1]
            }) 
        
        return el
    }
    const getIndicators = () => {
        return Array.from(document.querySelectorAll(`[data-status="${status}"]`))
    }

    const filteredCards = cards.filter((c) => c.status === status) 

    return(
    <div className="w-56 h-full shrink-0">
        <div className={`flex lg:text-xl ${bgColor} py-2 px-3 rounded-t-lg items-center justify-between`}>
            <h3 className={`font-medium ${headingColor}`}>
                {title}
            </h3>
            <span className="rounded text-sm text-neutral-400">
                {filteredCards.length}
            </span>
        </div>
        <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full h-full rounded transition-colors 
            ${active ? "bg-neutral-500/50":"bg-neutral-500/0"}`}>
                {filteredCards.map((c) => {
                    return <Card key={c.id} {...c} 
                    handleDragStart={handleDragStart}/>
                })}
                <DropIndicator beforeID="-1" status={status}/>
                <AddCard status={status} setCards={setCards} />
        </div>
    </div>)
}

const Card = ({title, id, status, handleDragStart}) => {
    return <>
        <DropIndicator beforeID={id} status={status}/>
        <motion.div layout layoutId={id} 
        draggable="true" 
        onDragStart={(e) => handleDragStart(e, {title, id, status})} 
        className="cursor-grab rounded border bg-gray-600 border-gray-500 p-3 
        active:cursor-grabbing">
            <p className="text-sm lg:text-base text-neutral-100">
                {title}
            </p>
        </motion.div>
    </>
}

const DropIndicator = ({ beforeID, status }) => {
    return(
        <div
            data-before={beforeID || "-1"}
            data-status={status}
            className="my-0.5 h-0.5 w-full
            bg-violet-400 opacity-0"
        />
    )
}

const BurnBarrel = ({ setCards }) => {

    const [active, setActive] = useState(false)

    const handleDragOver = (e) => {
        e.preventDefault()

        setActive(true)
    }

    const handleDragLeave = (e) => {
        setActive(false)
    }

    const handleDrop = async (e) => {
        e.preventDefault()

        const cardId = e.dataTransfer.getData("cardId")
        
        try {
            const response = await fetch(`${API_BASE}/api/kanban/${Number(cardId)}`, {
                method: "DELETE"
            })

            if (!response.ok) throw new Error("Delete failed")

            console.log("Deleted card ID: ", cardId)
            setCards((pv) => pv.filter((c) => c.id.toString() !== cardId))
        } catch (err){
            console.error("Error deleting card:", err)
        }
        setActive(false)
    }
    
    return <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl 
            ${active ? "border-red-600 bg-red-800/20 text-red-500" : "border-neutral-600 bg-neutral-800/20 text-neutral-500"}`}
    >
        {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
}

const AddCard = ({ status, setCards }) => {

    const [text, setText] = useState("")
    const [adding, setAdding] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!text.trim().length) return

        const newCard = {
            status: status,
            title: text.trim()
        }

        try {
            const response = await fetch(`${API_BASE}/api/kanban`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newCard),
            });

            if (!response.ok) throw new Error("Failed to save data");

            const savedItem = await response.json();
            console.log("Saved to DB:", savedItem);
            setCards((pv) => [...pv, savedItem])
        } catch (error) {
            console.error("Error saving item:", error);
        }

        setAdding(false)
    }

    return <>
        {adding ? 
            <motion.form
            layout
            onSubmit={handleSubmit}>
                <textarea 
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                    placeholder="Add new task..."
                    className="w-full rounded border 
                    border-violet-400 bg-violet-400/20 p-3
                    text-sm lg:text-base text-neutral-50 
                    placeholder-violet-300 focus:outline-0"
                    ></textarea>
                    <div className="mt-1.5 flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => setAdding(false)}
                            className="px-3 py-1.5 text-xs lg:text-sm
                            "
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1.5
                            rounded bg-neutral-50 px-3 py-1.5
                            text-xs lg:text-sm text-neutral-950
                            transition-colors hover:bg-neutral-300"
                        >
                            <span>Add</span>
                            <FiPlus />
                        </button>
                    </div>
            </motion.form> : <motion.button
                layout
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-1.5
                px-3 py-1.5 text-xs lg:text-sm text-neutral-400
                transition-colors rounded hover:bg-neutral-50/20 hover:text-neutral-50"
            >
                <span>Add Card</span>
                <FiPlus/>
        </motion.button>}
    </>
}

