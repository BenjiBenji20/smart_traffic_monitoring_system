from ultralytics import YOLO
import cv2
import math
import cvzone

cap = cv2.VideoCapture("http://<raspberry-pi-ip>:8080/video")  # livestream from pi to python via http
cap.set(3, 640)  # height
cap.set(4, 360)  # width

model = YOLO("../../vehicle-detection/image-weights/yolo11n.onnx")

classNames = [
    "person", "bicycle", "car", "motorbike", "aeroplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
    "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
    "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
    "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli",
    "carrot", "hot dog", "pizza", "donut", "cake", "chair", "sofa", "pottedplant", "bed",
    "diningtable", "toilet", "tvmonitor", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors",
    "teddy bear", "hair drier", "toothbrush"
]

# open the webcam
while True:
    success, img = cap.read()
    results = model(img, stream=True)

    if not success:
        break

    # loop through bounding boxes
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # FIND THE BOUNDING BOX
            # get the area of the box
            x1, y1, x2, y2 = box.xyxy[0]  # get the first element
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            # create a rectangle for bounding box
            # the cam read, width, height, color=green, line thickness
            # cv2.rectangle(img, (x1, y1), (x2, y2), (0, 200, 0), 3)
            w, h = x2 - x1, y2 - y1
            cvzone.cornerRect(img, (x1, y1, w, h), l=9)  # rectangle with design

            # DISPLAY CONFIDENCE VALUE
            conf = math.ceil((box.conf[0] * 100)) / 100
            # put text on the top of bounding box
            # cvzone.putTextRect(img, f"{conf}", (max(0, x1), max(35, y1)))

            # CLASS NAME
            cls = int(box.cls[0])  # get the first class index of detected object
            cvzone.putTextRect(img, f"{classNames[cls]} conf: {conf}",
                               (max(0, x1), max(35, y1)), scale=1, thickness=2, offset=3)

    cv2.imshow("Image", img)
    cv2.waitKey(1)  # 1ms delay
