import { ChangeEvent, useState } from "react";
import { Container, Button } from "react-bootstrap";


export default function Upload() {

    const [file, setFile] = useState<File>()

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files != null && e.target.files.length > 0) {
            setFile(e.target.files[0])
        }    
    }

    const handleUploadClick = async () => {
        if (!file) {
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        const options = {
            method: 'POST',
            body: formData,
        }
        try {
            const resp = await fetch('http://localhost:8000/upload', options)
            const json = await resp.json()
            if (!resp.ok) {
            } else {
            }
        } catch (error) {
        }
    }

    return (
        <Container>
            <input type='file' onChange={handleFileChange} />
            <Button onClick={handleUploadClick}>Carregar</Button>
        </Container>
    )
}