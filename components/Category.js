
import Image from "next/image"
import Link from "next/link"
export default function Category(props){

    return (
        <Link className="flex flex-col items-center w-max"
        href={`/chat/${props.navigate}`}
        >
            <div>
                <Image src={`/category/${props.srcName}.png`} width={70} height={70} alt={props.name}/>
            </div>
            <div className="text-lg">{props.name}</div>
        </Link>
    )
}