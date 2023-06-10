import { Heading } from '@chakra-ui/react'
import Head from 'next/head'
import Image from 'next/image'
import Main from '@/components/Main'

export default function Home() {
  return (
    <>
      <Head>
        <title>Trajectify</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Main/>
      </main>
    </>
  )
}
