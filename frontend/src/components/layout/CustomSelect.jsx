import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

const CustomSelect = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="custom-select-wrapper"
            style={{ position: "relative", width: "80px" }}
            onClick={() => setOpen(!open)}
        >
            <div
                className="custom-select-display"
                style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: "2px solid rgba(103, 68, 89, 0.5)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: "white",
                    color:"#674459",
                    lineHeight:"1",
                }}
            >
                <span>{value || "Select..."}</span>
                <FontAwesomeIcon icon={open ? faAngleUp : faAngleDown} style={{
                    fontSize:"14px",
                    display:"flex",
                    alignItems:"center"
                }} />
            </div>

            {open && (
                <ul
                    className="custom-select-options"
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: "5px 0",
                        position: "absolute",
                        width: "100%",
                        background:"#fff",
                        borderRadius: "12px",
                        top: "110%",
                        left: 0,
                        zIndex: 100,
                        maxHeight: "150px",
                        overflow:"hidden"
                    }}
                >
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className="custom-option"
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;