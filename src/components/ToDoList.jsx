import { useState } from "react"
import { closestCorners, DndContext } from "@dnd-kit/core"

import Collumn from "./Collumn"
import { arrayMove } from "@dnd-kit/sortable"

export default function ToDoList(){
    const [tasks, setTasks] = useState([])

    const getTaskPos = id => tasks.findIndex(task =>
        task.id === id)

    const handleDragEnd = event => {
        const {active, over} = event

        if(active.id === over.id) return;

        setTasks(tasks => {
            const originalPos = getTaskPos(active.id)
            const newPos = getTaskPos()

            return arrayMove(tasks, originalPos, newPos)
        })
    }
    

    return(
        <div className="bg-white dark:bg-gray-600 p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-center text-3xl font-bold mb-8">My tasks</h1>
            <DndContext
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}>
                <Collumn
                    tasks={tasks}
                />
            </DndContext>
        </div>
    )
}