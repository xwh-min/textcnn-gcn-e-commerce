import "../index.scss";
import { useEffect, useRef } from "@lynx-js/react";
import type { FC } from "@lynx-js/react";
import type { NodesRef } from "@lynx-js/types";
import type { Picture } from "../Pictures/furnitures/furnituresPictures";
import { ImageCard } from "./ImageCard";

interface ScrollViewProps {
  pictureData: Picture[];
}

export const ScrollView= (props: { pictureData: Picture[] }) => {
    const { pictureData } = props
    const scrollRef = useRef<NodesRef>(null)
    useEffect(() => {
        scrollRef.current?.invoke({
        method: "autoScroll",
        params: {
          rate: "60",
          start: true,
        },
      }).exec();
    }, [])
    return(
        <text 
        ref={scrollRef}
        className="list"
        list-type="waterfall"
        column-count={2}
        scroll-orientation="vertical"
        custom-list-name="list-container">
            {pictureData.map((item,index)=>
            <text key={index} 
            className="scroll-view-item">
                <ImageCard picture={item}/>
            </text>)}
        </text>
    )
}