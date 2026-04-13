import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { forwardRef } from 'react';

const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <div className="input-wrap" onClick={onClick} ref={ref}>
        <input
            readOnly
            value={value}
            placeholder={placeholder || 'JJ/MM/AAAA'}
            style={{ cursor: 'pointer' }}
        />
        <i className='bx bx-calendar' style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888',
            fontSize: '18px',
            pointerEvents: 'none'
        }}></i>
    </div>
));

const CustomDatePicker = ({ selected, onChange, placeholder, label, required }) => {
    return (
        <div className="form-group">
            {label && (
                <label>
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat="dd/MM/yyyy"
                placeholderText={placeholder || 'JJ/MM/AAAA'}
                customInput={<CustomInput />}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                todayButton="Aujourd'hui"
                locale="fr"
            />
        </div>
    );
};

export default CustomDatePicker;