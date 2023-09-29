import  Axios  from "axios"
import { useEffect, useState } from "react"


const MessagePage = ({ userID }) => {

  const [regData, setRegdata] = useState([])
  const [name, setName] = useState()

  useEffect(() => {

    if (Array.isArray(userID)) {

      Axios.get("https://halos-wheat.vercel.app/getList")
        .then(async (response) => {
          await userID.map(async (val) => {
            console.log();

            response.data.map(async (id) => {
              if (val.otherName_ID === id._id) {
                await setName(id.full_name);
              }
            });
          });
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  }, [userID]);

  

  return (

    <>

      <div className="m">

        <div>

          <h3>{name}</h3>

        </div>

      </div>
      
    
    </>

  )


}

export default MessagePage
