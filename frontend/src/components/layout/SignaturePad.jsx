import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = ({ onChange }) => {
    const sigRef = useRef(null);

    const clear = () => {
        sigRef.current.clear();
        onChange("");
    };

    const save = () => {
        if (sigRef.current.isEmpty()) return;
        const dataUrl = sigRef.current.toDataURL("image/png");
        onChange(dataUrl);
    };

    return (
        <div className="signature-box">
            <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                    width: 500,
                    height: 160,
                    className: "sig-canvas"
                }}
                onEnd={save}
            />

            <div className="signature-actions">
                <button type="button" onClick={clear}>Effacer</button>
            </div>
        </div>
    );
};

export default SignaturePad;