import React from "react"
import "../dataEditor.css"

function ImageEditor({
    value,
    onChange = () => {},
}: {
    value: ImageData | null
    onChange: (newValue: ImageData) => void
}) {
    const [imageUrl, setImageUrl] = React.useState<string>("")
    const ref = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (value && value.width + value.height > 2) {
            // value can sometimes be a faked ImageData object (for node.js compatibility),
            // so recreate it
            const imgData = new ImageData(value.width, value.height, {
                colorSpace: value.colorSpace,
            })
            imgData.data.set(value.data)
            const canvas = document.createElement("canvas")
            canvas.width = imgData.width
            canvas.height = imgData.height
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            ctx.putImageData(imgData, 0, 0)
            const url = canvas.toDataURL()
            setImageUrl(url)
        } else {
            setImageUrl("")
        }
    }, [value])

    function onInputEnd() {
        const file = ref.current?.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = function (e) {
            const img = new Image()
            img.onload = function () {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")
                if (!ctx) return
                const maxDim = 500
                if (img.width < maxDim && img.height < maxDim) {
                    canvas.width = img.width
                    canvas.height = img.height
                } else if (img.width > img.height) {
                    canvas.width = maxDim
                    canvas.height = (img.height / img.width) * maxDim
                } else {
                    canvas.width = (img.width / img.height) * maxDim
                    canvas.height = maxDim
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                )
                const url = canvas.toDataURL()
                setImageUrl(url)
                onChange(imageData)
            }
            if (e.target?.result) {
                img.src = e.target.result as string
            }
        }
        reader.readAsDataURL(new Blob([file], { type: "image/*" }))
    }

    return (
        <>
            <button
                className="const-color-btn"
                onClick={() => ref.current?.click()}
            >
                {imageUrl ? <img src={imageUrl} /> : "Upload Image"}
            </button>
            <input
                ref={ref}
                style={{ display: "none" }}
                type="file"
                accept="image/*"
                onChange={onInputEnd}
            />
        </>
    )
}

export default ImageEditor
