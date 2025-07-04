import { useState } from 'react';
import './App.css'
import ClockInForm from './components/ClockInForm'
import ClockInTable from './components/ClockInTable'
import Kanban from './components/Kanban';
import { MdLockClock } from "react-icons/md";

function App() {

  const [clockedInData, setClockedInData] = useState([]);

  return (
    <div className='h-fit'>
      <header className='text-5xl bg-gray-700 px-4 py-1 font-bold flex items-center '>
          <MdLockClock className='text-7xl'/>
          <h1>ocked-In</h1>
      </header>
      <div className="h-210 items-center">
        <div className='flex flex-col lg:flex-row justify-center gap-4 p-4'>
          <div className='w-full h-full lg:max-w-163 gap-4 flex flex-col md:flex-row lg:flex-col items-center justify-center'>
            <ClockInForm
              setData={setClockedInData}
            />
            <ClockInTable
              data={clockedInData}
              setData={setClockedInData}
            />
          </div>
          <Kanban/>
        </div>
      </div>
    </div>
  )
}

export default App
