import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'
import arrow from './assets/arrow.png'
import lynxLogo from './assets/lynx-logo.png'
import reactLynxLogo from './assets/react-logo.png'
import { useFlappy } from './useFlappy'
import ShinyText from './components/ShinyText'
import { ScrollView } from './components/Scroll-viev'
import { furnituresPictures } from "./Pictures/furnitures/furnituresPictures"
import { Gallery } from './components/Gallery'

export function App() {
  const [alterLogo, setAlterLogo] = useState(false)
  const [logoY, jump] = useFlappy()

  useEffect(() => {
    console.info('Hello, ReactLynx')
  }, [])

  const onTap = useCallback(() => {
    'background only'
    setAlterLogo(prevAlterLogo => !prevAlterLogo)
  }, [])
  

  return (
    <view bindtap={jump}>
      <view className='Background' />
      <view className='App'>
        <view className='Banner'>
          <view
            className='Logo'
            style={{ transform: `translateY(${logoY}px)` }}
            bindtap={onTap}
          >
            {alterLogo
              ? <image src={reactLynxLogo} className='Logo--react' />
              : <image src={lynxLogo} className='Logo--lynx' />}
          </view>   
          <text className='Title'>e-commerce</text>
          <text className='Subtitle'>on Lynx</text>
        </view>
        <view className='Content'>
          <image src={arrow} className='Arrow' />
          <text className='Description'>Tap the logo and have fun!</text>
          <ShinyText   
          text='Tap the logo and have fun!' 
          speed={1.5} 
          shineColor='#ffd700' /> 
          <text className='Hint'>
            Edit<text
              style={{
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              {' src/App.tsx '}
            </text>
            to see updates!
          </text>
        </view>
        <view style={{ flex: 1 }} />
      </view>
      <ScrollView pictureData={furnituresPictures}/>
      <Gallery pictureData={furnituresPictures} />
    </view>
  )
}
