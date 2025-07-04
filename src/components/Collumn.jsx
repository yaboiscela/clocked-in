import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable'

import Task from './Task'

export default function Collumn({ tasks }){

    return(
        <div className="bg-white dark:bg-gray-500 py-4 px-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-center text-xl font-semibold mb-4">TO-DO</h1>
            <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                {tasks.map((task) =>(
                    <Task id={task.id} title={task.title} key={task.id}/>
                ))}
            </SortableContext>
        </div>
    )   
}