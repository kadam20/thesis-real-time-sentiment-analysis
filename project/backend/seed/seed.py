import asyncio
from backend.db.connection import Database

async def seed():
    db = Database()
    await db.init_pool()

    try:
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                # SQL to create the tweets table
                create_table_query = """
                CREATE TABLE IF NOT EXISTS tweets (
                    id SERIAL PRIMARY KEY,
                    tweet_id TEXT,
                    tweet TEXT,
                    likes INT DEFAULT 0,
                    retweet_count INT DEFAULT 0,
                    user_id BIGINT,
                    user_name VARCHAR(255),
                    user_description TEXT,
                    user_join_date DATE,
                    user_followers_count INT DEFAULT 0,
                    user_location VARCHAR(255),
                    city VARCHAR(255),
                    country VARCHAR(255),
                    continent VARCHAR(255),
                    candidate VARCHAR(255),
                    state VARCHAR(255),
                    state_code VARCHAR(10),
                    sentiment_label VARCHAR(50),
                    sentiment_score FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
                
                # SQL to create the trigger function
                create_trigger_function_query = """
                CREATE OR REPLACE FUNCTION notify_new_data()
                RETURNS TRIGGER AS $$
                BEGIN
                    PERFORM pg_notify(
                        'new_data',
                        json_build_object(
                            'id', NEW.id,
                            'tweet', NEW.tweet,
                            'likes', NEW.likes,
                            'retweetCount', NEW.retweet_count,
                            'userName', NEW.user_name,
                            'userFollower', NEW.user_followers_count,
                            'state', NEW.state,
                            'stateCode', NEW.state_code,
                            'candidate', NEW.candidate,
                            'sentimentLabel', NEW.sentiment_label,
                            'sentimentScore', NEW.sentiment_score
                        )::text
                    );
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """

                # SQL to create the trigger
                create_trigger_query = """
                CREATE TRIGGER trigger_new_data
                AFTER INSERT ON tweets
                FOR EACH ROW
                EXECUTE FUNCTION notify_new_data();
                """

                print("Creating table 'tweets'...")
                await conn.execute(create_table_query)
                print("Table created.")

                print("Creating trigger function 'notify_new_data'...")
                await conn.execute(create_trigger_function_query)
                print("Trigger function created.")

                print("Creating trigger 'trigger_new_data'...")
                await conn.execute(create_trigger_query)
                print("Trigger created.")

                print("Database setup complete.")
    except Exception as e:
        print(f"Error during database setup: {e}")
    finally:
        await db.close_pool()
        print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(seed())