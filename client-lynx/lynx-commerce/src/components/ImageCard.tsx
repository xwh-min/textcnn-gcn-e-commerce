import type { Picture } from "../Pictures/furnitures/furnituresPictures.js";
import "../index.scss";
export const ImageCard = (props:{picture:Picture}) => {
    const {picture}=props
    return(
         <image
        className="image"
        style={{ width: "100%", aspectRatio: picture.width / picture.height }}
        src={picture.src}
      />
    )
}