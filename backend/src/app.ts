import express, { type Request, type Response, type Express } from "express";
import fs from "node:fs/promises";

const app: Express = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ message: "Hello World" });
});

app.get("/users", (req: Request, res: Response) => {
    res.json([
        { id: 1, name: "Shreyas" },
        { id: 2, name: "Shubham" }
    ]);
})


app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});
