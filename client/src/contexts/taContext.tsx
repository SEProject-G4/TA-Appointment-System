// import axios from "axios";
// import { createContext,useState ,useEffect} from "react";



// export const taContext=createContext(null)

// const taContextProvider =(props)=>{


//     const url="http://localhost:5000";

//     const [requests, setRequests] = useState([]);

//     const fetchRequests = async () => {
//         const response = await axios.get(url+"/api/ta/requests");
//         console.log(response.data);
//         setRequests(response.data.data);
//     }

 

//     useEffect(()=>{
  
//         async function loadData() {
//             await fetchRequests();
//         }
//         loadData();
//     },[])

//     const contexValue ={
//         requests

//     }
//     return(
//         <taContext.Provider value={contexValue}>
//             {props.children}
//         </taContext.Provider>
//     )
// }

// export default taContextProvider;