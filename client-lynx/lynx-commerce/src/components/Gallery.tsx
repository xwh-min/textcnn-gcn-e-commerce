import "../index.scss";
import { useEffect, useRef } from "@lynx-js/react";
import type { NodesRef } from "@lynx-js/types";
import { ImageCard } from "./ImageCard";
import type { Picture } from "../Pictures/furnitures/furnituresPictures.jsx";


export const Gallery = (props: { pictureData: Picture[] }) => {
  const { pictureData } = props;
  const galleryRef = useRef<NodesRef>(null);

  useEffect(() => {
    galleryRef.current
      ?.invoke({
        method: "autoScroll",
        params: {
          rate: "60",
          start: true,
        },
      })
      .exec();
  }, []);

  return (
    <view className="gallery-wrapper">
      <list
        ref={galleryRef}
        className="list"
        list-type="waterfall"
        column-count={2}
        scroll-orientation="vertical"
        custom-list-name="list-container"
      >
        {pictureData.map((picture: Picture, index: number) => (
          <list-item
            
            item-key={"" + index}
            key={"" + index}
          >
            <ImageCard picture={picture} />
          </list-item>
        ))}
      </list>
    </view>
  );
};

export default Gallery;