'use client'
import { useEffect, useMemo, useState } from 'react';
import { WaterStationType, WaterType } from '../lib/definitions';
import MyInput from '@/components/Reusables/MyInput';
import addCustomerOrder from '../auth/actions/Orders/addOrders';
import SubmitButton from '@/components/Reusables/SubmitButton';
import BasicDocument from './Invoice/print';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import { Router } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  firstName: string;
  lastName: string;
  contact_no: number;
  address: string;
  delivery_mode: string;
  remarks: string;
  email: string;
}

interface WaterTypeQty extends WaterType {
  quantity: number;
}

interface OrderComponentProps {
  error: Error | null;
  waterTypes: WaterType[] | null; // Replace YourWaterTypeType with the actual type
  refillingStation: WaterStationType | null; // Replace YourRefillingStationType with the actual type
}

const OrderComponent: React.FC<OrderComponentProps> = ({
  error,
  waterTypes,
  refillingStation,
}) => {

  if (error) {
    console.error("Error:", error);
  }

  const [user, setUser] = useState<User>({
    firstName: '',
    lastName: '',
    contact_no: 0,
    address: '',
    delivery_mode: '',
    remarks: '',
    email: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const [cart, setCart] = useState< WaterTypeQty[]>([]);

  const addQuantity = (itemId: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const reduceQuantity = (itemId: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 0 }
          : item
      ).filter((item) => item.quantity > 0) // Remove items with quantity 0 from the cart
    );
  };
  

  const addToCart = (waterType: WaterType) => {
    const existingItemIndex = cart.findIndex((item) => item.id === waterType.id);
  
    if (existingItemIndex !== -1) {
      // If the item is already in the cart, update its quantity
      setCart((prevCart) => {
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1,
        };
        return newCart;
      });
    } else {
      // If the item is not in the cart, add it with quantity 1
      setCart((prevCart) => [...prevCart, { ...waterType, quantity: 1 }]);
    }
  };
  

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const total = useMemo<number>(() => {
    const calculateTotal = () => {
      return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    return calculateTotal();
  }, [cart])

  const [forPrinting, setForPrint] = useState<Boolean>(false); //to show the printing button
  const [message, setMessage] = useState<String>(''); // to return a message
    
    //loading state for the submission
    const [loading, setLoading] = useState<Boolean>(false);
  


  //form submission
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    // Create a FormData instance
    const formData = new FormData();
  
    // Append form fields to FormData
    formData.append('firstName', e.currentTarget.firstName.value);
    formData.append('lastName', e.currentTarget.lastName.value);
    formData.append('contact_no', e.currentTarget.contact_no.value);
    formData.append('email', e.currentTarget.email.value)
    formData.append('address', e.currentTarget.address.value);
    formData.append('delivery_mode', e.currentTarget.delivery_mode.value);
    formData.append('remarks', e.currentTarget.remarks.value);
    formData.append('water_station_id', e.currentTarget.refilling_station_id.value )
    formData.append('refilling_station_user_id', e.currentTarget.refilling_station_user_id.value);
    formData.append('refilling_station_name', e.currentTarget.refilling_station_name.value);

  //form submission
    try{
      const res =  await addCustomerOrder(cart, total, formData);
      setMessage(res.message)

      // Reset the user state to blank values
      setUser({
        firstName: '',
        lastName: '',
        contact_no: 0,
        address: '',
        delivery_mode: '',
        remarks: '',
        email: ''
      });

      setCart([])

      setForPrint(true);

      setLoading(true);

    }catch(err){
      setMessage("Unable to save.")
    }
  };

  const router = useRouter()

  return (
    <div id="CheckOutPage" className='mt-4 max-w-[1100px] msx-auto'>
      <div className='text-2xl font-bold mt-4 mb-4'>Order Page</div>
      <h1><p>{message}</p></h1>
      {/* Render other components based on the data */}
      <h1>Station Details: </h1>
      <strong>Station Name:</strong> {refillingStation?.station_name} <br />
      <strong>Address:</strong> {refillingStation?.address + "," + refillingStation?.barangay} <br />
      <strong>Landmark:</strong> {refillingStation?.landmark} <br />
      <strong>Contact No:</strong> {refillingStation?.contact_no} <br />
      {refillingStation?.tel_no && (
        <p>Tel No: {refillingStation.tel_no}</p>
      )}
      <div className="py-3 flex items-center text-sm text-gray-800 before:flex-[1_1_0%] before:border-t before:border-gray-200 before:me-6 after:flex-[1_1_0%] after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:before:border-gray-600 dark:after:border-gray-600">
        User Form
      </div>
      
      <form onSubmit={handleFormSubmit}>
      <div className="justify-center space-y-12">
        
        {/* Hidden input fields */}
        <input type="hidden" name="refilling_station_name" value={refillingStation?.station_name}/>
        <input type="hidden" name="refilling_station_id" value={refillingStation?.id}/>
        <input type="hidden" name="refilling_station_user_id" value={refillingStation?.user_id}/>

    
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Personal Information</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">Use an active email address and contact number so we can inform you of your orders.</p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
            <MyInput
              id="firstName"
              label="First Name"
              value={user.firstName}
              onChange={handleInputChange}
              required
              type="text" htmlFor={"First Name"} defaultValue={''} /> 
            </div>

            <div className="sm:col-span-3">
            <MyInput
                id="lastName"
                label="Last Name"
                value={user.lastName}
                onChange={handleInputChange}
                required
                type="text" htmlFor={'First Name'} defaultValue={''}/> 
            </div>

            <div className="sm:col-span-3">
            <MyInput
                id="contact_no"
                label="Contact No"
                value={user.contact_no}
                onChange={handleInputChange}
                required
                type="number" htmlFor={'First Name'} defaultValue={''}/> 
            </div>

            <div className="sm:col-span-3">
            <MyInput
                id="email"
                label="Email"
                value={user.email}
                onChange={handleInputChange}
                required
                type="email"
                placeholder='We will be sending you the invoice on your email so please provide an active email.' 
                htmlFor={'Email'} defaultValue={''} /> 
            </div>

            <div className="col-span-full">
              <MyInput
                id="address"
                label="Bldg No, Zone, Street, Barangay"
                value={user.address}
                onChange={handleInputChange}
                required
                type="text" htmlFor={'Address'} defaultValue={''} />
            </div>

            <div className="col-span-full">
              <MyInput
                id="delivery_mode"
                label={`Available Delivery Mode: ${refillingStation?.delivery_mode}`}
                value={user.delivery_mode}
                onChange={handleInputChange}
                required
                placeholder='Enter the chosen delivery mode if there is any. Else, you may enter your additional instructions for deliveries or pick-up'
                type="text" htmlFor={'Delivery-Mode'} defaultValue={''}/> 
            </div>

            <div className='col-span-full'>
            <MyInput
                id="remarks"
                label="Remarks or Instructions you would like to add"
                value={user.remarks}
                onChange={handleInputChange}
                type="text" htmlFor={'Remarks'} defaultValue={''} />
            </div>

              {cart.length !== 0 ? (
                <>
                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button type="button" className="text-sm font-semibold leading-6 text-gray-900" onClick={() => router.back()}>
                    Cancel  
                  </button>
                  <SubmitButton
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" pending={false}                  >
                    Save
                  </SubmitButton>
                </div>
                </>
              
              ) : (
                <>You must add waters for your orders</>
              )}


          </div>
        </div>

      </div>

    </form>
    
      {forPrinting === true && 
      <>
      <h1>This is your invoice. Please download it</h1>
        <PDFDownloadLink document={<BasicDocument cart={cart} total={total} user={user}/>} fileName="my-order.pdf">
        {({ blob, url, loading, error }) =>
          loading ? 'Loading document...' : 'Download now!'
        }
      </PDFDownloadLink>
      </>
      }

      <div className="py-3 flex items-center text-sm text-gray-800 before:flex-[1_1_0%] before:border-t before:border-gray-200 before:me-6 after:flex-[1_1_0%] after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:before:border-gray-600 dark:after:border-gray-600">
        Add your order
      </div>
    

      <h1>Water Available:</h1>
      {waterTypes?.map((waterType) => (
       <div key={waterType.id}>
       <strong>Name:</strong> {waterType.name}, <strong>Price:</strong> {waterType.price}
       <button onClick={() => addToCart(waterType)}>Add to Cart (Per Liter) </button>
     </div>
      ))}
      <div className="py-3 flex items-center text-sm text-gray-800 before:flex-[1_1_0%] before:border-t before:border-gray-200 before:me-6 after:flex-[1_1_0%] after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:before:border-gray-600 dark:after:border-gray-600">
        Your Cart
      </div>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                <p>{item.name} - ${item.price} </p>
                <p>Liter: {item.quantity}</p> 
                <p>Unit price: {item.quantity * item.price}</p>
                <button onClick={() => addQuantity(item.id)}>+ Add more Liter(s)</button>
                <button onClick={() => reduceQuantity(item.id)}>- Reduce Liter(s)</button>
                <br/>
                <button onClick={() => removeFromCart(item.id)}>Remove</button>
              </li>
            ))}
          </ul>

        <div className="py-3 flex items-center text-sm text-gray-800 before:flex-[1_1_0%] before:border-t before:border-gray-200 before:me-6 after:flex-[1_1_0%] after:border-t after:border-gray-200 after:ms-6 dark:text-white dark:before:border-gray-600 dark:after:border-gray-600">
          Your Final Order
        </div>

          <div>
            {cart.length === 0 ? (
              <h3>You do not have any orders</h3>
            ): (
              <div>
                {cart.map((item,i) => (
                  <ul key={i}>
                    <li>{item.name} - {item.price}</li>
                    <li>Unit Price: {item.price * item.quantity}</li>
                  </ul>
                ))}
                <h3>Total Amount of your purchase: Php {total}</h3>
              </div>
            )}          
          </div>
        
        </div>
      

  );
};

export default OrderComponent;



