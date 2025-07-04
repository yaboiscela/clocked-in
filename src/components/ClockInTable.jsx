import { useState, useEffect } from 'react';

import io from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const socket = io(API_BASE); 

export default function ClockInTable(props) {

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 7

    const safeData = Array.isArray(props.data) ? props.data : [];

    useEffect(() => {
        const fetchData = () => {
        fetch(`${API_BASE}/api/timeTracker`)
            .then(res => res.json())
            .then(data => {
            props.setData(data);
            })
            .catch(err => {
            console.error("Error fetching time logs:", err);
            });
        };

        fetchData();

        socket.on('new-entry', () => {
        fetchData(); 
        });

        return () => socket.off('new-entry');
    }, []);

    return(
        <div className='w-full'>
            <div className="rounded-2xl h-[243px] md:h-[307px] lg:h-[419px] w-full overflow-auto text-center shadow-sm/50">
            <h1 className='text-xl md:text-2xl lg:text-4xl py-2 lg:py-3 bg-white font-bold border-b-1 dark:bg-gray-600 text-center'>Logs</h1>
                <table className='w-full'>
                    <thead className='bg-gray-500'>
                        <tr className='text-sm md:text-base lg:text-xl'>
                            <th className='py-1 lg:py-2'>Date</th>
                            <th className='py-1 lg:py-2'>In</th>
                            <th className='py-1 lg:py-2'>Out</th>
                            <th className='py-1 lg:py-2'>Hours</th>
                        </tr>
                    </thead>
                    <tbody className='text-xs md:text-base lg:text-xl'>
                        {safeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
                            <tr className='odd:bg-gray-400 even:bg-gray-500' key={index}>
                                <td className='py-1 lg:py-2'>{new Date(item.date).toLocaleDateString
                                    ('en-US',{
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</td>
                                <td className='py-1 lg:py-2'>{item.clock_in}</td>
                                <td className='py-1 lg:py-2'>{item.clock_out}</td>
                                <td className='py-1 lg:py-2'>{item.hours}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div className="mt-3 justify-self-center
            md:text-lg lg:text-xl">
                <div className="flex items-center gap-4 space-x-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-400 rounded disabled:opacity-50"
                    disabled={currentPage === 1}
                >
                    Previous
                </button>

                <span className="font-semibold">
                    Page {currentPage} of {Math.ceil(props.data.length / itemsPerPage)}
                </span>

                <button
                    onClick={() =>
                    setCurrentPage(prev =>
                        prev < Math.ceil(props.data.length / itemsPerPage) ? prev + 1 : prev
                    )
                    }
                    className="px-8 py-1 bg-gray-500 hover:bg-gray-400 rounded disabled:opacity-50"
                    disabled={currentPage === Math.ceil(props.data.length / itemsPerPage)}
                >
                    Next
                </button>
                </div>
            </div>
        </div>
    );
}