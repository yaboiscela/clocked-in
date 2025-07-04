import { useSortable } from "@dnd-kit/sortable"

export default function Task ({id, title}){

    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id})

    const style = {
        transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
        transition
    };
    
    return(
        <div 
        ref={setNodeRef} 
        {...attributes} 
        {...listeners} 
        style={style} 
        className="flex items-center py-2 px-4 bg-white dark:bg-gray-400 rounded text-lg mb-2">
            <input type="checkbox" className=" mr-4"/>
            <p>{title}</p>
        </div>
    )
}